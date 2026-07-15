import { CardStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GRID_TYPE_SLOTS } from '@/types/binder'
import { resolveCanonicalCardIds, deriveDisplayCardId } from '@/lib/resolve-canonical-card'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { addCardsBatchSchema } from '@/lib/schemas/binder'
import { planSlotPlacement } from '@/lib/binder-slot-placement'
import { MAX_PAGES_PER_BINDER } from '@/lib/binder-limits'
import { batchAddIpLimiter, batchAddUserLimiter } from '@/lib/rate-limit'

type RouteContext = { params: Promise<{ id: string }> }

class PageLimitExceededError extends Error {
  constructor(public remainingCapacity: number) {
    super('pageLimitReached')
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const { id: binderId } = await context.params

  const binder = await prisma.binder.findUnique({ where: { id: binderId } })
  if (!binder || binder.userId !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
  const ipResult = await batchAddIpLimiter.limit(ip)
  if (!ipResult.success) {
    return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
  }
  const userResult = await batchAddUserLimiter.limit(userId)
  if (!userResult.success) {
    return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const parseResult = addCardsBatchSchema.safeParse(body)
  if (!parseResult.success) {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  const { cardIds, status: typedStatus, quantity: typedQuantity } = parseResult.data

  const resolvedMap = await resolveCanonicalCardIds(prisma, cardIds)
  const invalidCardIds = cardIds.filter((id) => resolvedMap.get(id)?.status !== 'ok')
  if (invalidCardIds.length > 0) {
    return Response.json({ error: 'Card not found', invalidCardIds }, { status: 404 })
  }

  // 每張原始卡（去重）各自的 resolve 結果，保留原始順序供逐格展平使用
  const uniqueOriginalIds = Array.from(new Set(cardIds))
  const perCard = uniqueOriginalIds.map((originalId) => {
    const resolved = resolvedMap.get(originalId) as { status: 'ok'; resolvedCardId: string }
    const resolvedCardId = resolved.resolvedCardId
    return {
      originalId,
      resolvedCardId,
      displayCardId: deriveDisplayCardId(originalId, resolvedCardId),
    }
  })

  // 依 resolvedCardId 聚合 UserCard upsert，避免同一 canonical（如 alias + 自身皆選）觸發
  // 多次 upsert 造成 increment race；displayCardId 取首見值（比照單張「首次寫入保留」）。
  const aggregated = new Map<string, { displayCardId: string | null; totalQuantity: number }>()
  for (const card of perCard) {
    const existing = aggregated.get(card.resolvedCardId)
    if (existing) {
      existing.totalQuantity += typedQuantity
    } else {
      aggregated.set(card.resolvedCardId, { displayCardId: card.displayCardId, totalQuantity: typedQuantity })
    }
  }

  // 展平「待填清單」：每張原始卡 × quantity，逐格帶自己的 displayCardId（勿全批共用）
  const fillList: { cardId: string; displayCardId: string | null; status: CardStatus }[] = []
  for (const card of perCard) {
    for (let i = 0; i < typedQuantity; i++) {
      fillList.push({ cardId: card.resolvedCardId, displayCardId: card.displayCardId, status: typedStatus })
    }
  }

  const slotsPerPage = GRID_TYPE_SLOTS[binder.gridType]
  const totalNeeded = fillList.length

  try {
    const result = await prisma.$transaction(async (tx) => {
      const emptySlots = await tx.binderSlot.findMany({
        where: { binderId, cardId: null },
        orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
        take: totalNeeded,
      })

      const lastSlot = await tx.binderSlot.findFirst({
        where: { binderId },
        orderBy: [{ pageNumber: 'desc' }, { slotIndex: 'desc' }],
      })

      const placement = planSlotPlacement({
        emptySlotIds: emptySlots.map((s) => s.id),
        lastSlot: lastSlot ? { pageNumber: lastSlot.pageNumber, slotIndex: lastSlot.slotIndex } : null,
        slotsPerPage,
        needed: totalNeeded,
      })

      if (placement.exceedsLimit) {
        throw new PageLimitExceededError(placement.remainingCapacity)
      }

      await Promise.all(
        Array.from(aggregated.entries()).map(([resolvedCardId, agg]) =>
          tx.userCard.upsert({
            where: { userId_cardId_status: { userId, cardId: resolvedCardId, status: typedStatus } },
            create: {
              userId,
              cardId: resolvedCardId,
              status: typedStatus,
              quantity: agg.totalQuantity,
              displayCardId: agg.displayCardId,
            },
            update: { quantity: { increment: agg.totalQuantity } },
          }),
        ),
      )

      if (placement.fillSlotIds.length > 0) {
        await Promise.all(
          placement.fillSlotIds.map((slotId, i) => {
            const card = fillList[i]
            return tx.binderSlot.update({
              where: { id: slotId },
              data: { cardId: card.cardId, status: card.status, displayCardId: card.displayCardId },
            })
          }),
        )
      }

      let updatedTotalPages: number | undefined

      if (placement.newPositions.length > 0) {
        const offset = placement.fillSlotIds.length
        const newSlots = placement.newPositions.map((pos, i) => {
          const card = fillList[offset + i]
          return {
            binderId,
            cardId: card.cardId,
            displayCardId: card.displayCardId,
            status: card.status,
            pageNumber: pos.pageNumber,
            slotIndex: pos.slotIndex,
          }
        })

        await tx.binderSlot.createMany({ data: newSlots })

        const maxNewPage = Math.max(...newSlots.map((s) => s.pageNumber))
        const currentSettings = (binder.settings as Record<string, unknown> | null) ?? {}
        const currentTotalPages =
          typeof currentSettings.totalPages === 'number' ? currentSettings.totalPages : 0
        if (maxNewPage > currentTotalPages) {
          await tx.binder.update({
            where: { id: binderId },
            data: { settings: { ...currentSettings, totalPages: maxNewPage } },
          })
          updatedTotalPages = maxNewPage
        }
      }

      return { updatedTotalPages }
    })

    revalidatePublicBinder(binder.shareToken)
    return Response.json({
      slotsAdded: totalNeeded,
      cardsAdded: perCard.length,
      ...(result.updatedTotalPages !== undefined ? { updatedTotalPages: result.updatedTotalPages } : {}),
    })
  } catch (err) {
    if (err instanceof PageLimitExceededError) {
      return Response.json(
        { error: 'pageLimitReached', max: MAX_PAGES_PER_BINDER, remainingCapacity: err.remainingCapacity },
        { status: 409 },
      )
    }
    throw err
  }
}
