import { CardStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GRID_TYPE_COLS, GRID_TYPE_SLOTS } from '@/types/binder'
import { resolveCanonicalCardId, deriveDisplayCardId } from '@/lib/resolve-canonical-card'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { addCardsSchema } from '@/lib/schemas/binder'
import { planSlotPlacement } from '@/lib/binder-slot-placement'
import { MAX_PAGES_PER_BINDER } from '@/lib/binder-limits'
import { resolveSpanLayout } from '@/lib/multi-card-layout'
import {
  loadBinderCells,
  loadSpanLayoutForCard,
  placeSpanGroup,
  resolveTotalPages,
} from '@/lib/binder-span'

type RouteContext = { params: Promise<{ id: string }> }

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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { cardId, status, quantity } = body as Record<string, unknown>

  const resolved = await resolveCanonicalCardId(prisma, cardId as string)
  if (resolved.status === 'not_found') {
    return Response.json({ error: 'Card not found' }, { status: 404 })
  }
  if (resolved.status === 'canonical_missing') {
    return Response.json({ error: 'Canonical card not found' }, { status: 404 })
  }

  if (!addCardsSchema.shape.quantity.safeParse(quantity).success) {
    return Response.json({ error: 'quantity must be an integer between 1 and 99' }, { status: 400 })
  }

  const statusResult = addCardsSchema.shape.status.safeParse(status)
  if (!statusResult.success) {
    return Response.json({ error: "status must be 'owned' or 'wanted'" }, { status: 400 })
  }

  const typedCardId = resolved.resolvedCardId
  // 保留原始顯示語言（OPCG ZH_TW alias）；純 canonical 加入則 null
  const displayCardId = deriveDisplayCardId(cardId as string, typedCardId)
  const typedStatus = statusResult.data
  const typedQuantity = quantity as number

  const slotsPerPage = GRID_TYPE_SLOTS[binder.gridType]
  const gridCols = GRID_TYPE_COLS[binder.gridType]

  // 複數卡佔 N 格：先在此判定，格線放不下就回 null 直接走既有單格路徑
  const spanLayout = await loadSpanLayoutForCard(prisma, typedCardId, gridCols, slotsPerPage)

  class PageLimitExceededError extends Error {
    constructor(public remainingCapacity: number) {
      super('pageLimitReached')
    }
  }

  if (spanLayout) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const cells = await loadBinderCells(tx, binderId)
        let totalPages = await resolveTotalPages(tx, binderId, binder.settings)
        const initialTotalPages = totalPages

        for (let i = 0; i < typedQuantity; i++) {
          const placed = await placeSpanGroup(tx, {
            binderId,
            cardId: typedCardId,
            displayCardId,
            status: typedStatus,
            layout: spanLayout,
            cells,
            gridCols,
            slotsPerPage,
            totalPages,
          })
          if (placed.status !== 'placed') throw new PageLimitExceededError(0)
          totalPages = placed.totalPages
        }

        const userCard = await tx.userCard.upsert({
          where: { userId_cardId_status: { userId, cardId: typedCardId, status: typedStatus } },
          create: { userId, cardId: typedCardId, status: typedStatus, quantity: typedQuantity, displayCardId },
          update: { quantity: { increment: typedQuantity } },
        })

        let updatedTotalPages: number | undefined
        if (totalPages > initialTotalPages) {
          const currentSettings = (binder.settings as Record<string, unknown> | null) ?? {}
          await tx.binder.update({
            where: { id: binderId },
            data: { settings: { ...currentSettings, totalPages } },
          })
          updatedTotalPages = totalPages
        }

        return { userCard, updatedTotalPages }
      })

      revalidatePublicBinder(binder.shareToken)
      return Response.json({
        slotsAdded: typedQuantity,
        userCard: {
          id: result.userCard.id,
          cardId: result.userCard.cardId,
          status: result.userCard.status,
          quantity: result.userCard.quantity,
        },
        ...(result.updatedTotalPages !== undefined
          ? { updatedTotalPages: result.updatedTotalPages }
          : {}),
      })
    } catch (err) {
      if (err instanceof PageLimitExceededError) {
        return Response.json(
          { error: 'pageLimitReached', max: MAX_PAGES_PER_BINDER, remainingCapacity: 0 },
          { status: 409 },
        )
      }
      throw err
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const emptySlots = await tx.binderSlot.findMany({
        where: { binderId, cardId: null },
        orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
        take: typedQuantity,
      })

      const lastSlot = await tx.binderSlot.findFirst({
        where: { binderId },
        orderBy: [{ pageNumber: 'desc' }, { slotIndex: 'desc' }],
      })

      const placement = planSlotPlacement({
        emptySlotIds: emptySlots.map((s) => s.id),
        lastSlot: lastSlot ? { pageNumber: lastSlot.pageNumber, slotIndex: lastSlot.slotIndex } : null,
        slotsPerPage,
        needed: typedQuantity,
      })

      if (placement.exceedsLimit) {
        throw new PageLimitExceededError(placement.remainingCapacity)
      }

      const userCard = await tx.userCard.upsert({
        where: { userId_cardId_status: { userId, cardId: typedCardId, status: typedStatus } },
        create: { userId, cardId: typedCardId, status: typedStatus, quantity: typedQuantity, displayCardId },
        update: { quantity: { increment: typedQuantity } },
      })

      if (placement.fillSlotIds.length > 0) {
        await Promise.all(
          placement.fillSlotIds.map((slotId) =>
            tx.binderSlot.update({
              where: { id: slotId },
              data: { cardId: typedCardId, status: typedStatus, displayCardId },
            }),
          ),
        )
      }

      let updatedTotalPages: number | undefined

      if (placement.newPositions.length > 0) {
        const newSlots: {
          binderId: string
          cardId: string
          displayCardId: string | null
          status: CardStatus
          pageNumber: number
          slotIndex: number
        }[] = placement.newPositions.map((pos) => ({
          binderId,
          cardId: typedCardId,
          displayCardId,
          status: typedStatus,
          pageNumber: pos.pageNumber,
          slotIndex: pos.slotIndex,
        }))

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

      return { userCard, updatedTotalPages }
    })

    revalidatePublicBinder(binder.shareToken)
    return Response.json({
      slotsAdded: typedQuantity,
      userCard: {
        id: result.userCard.id,
        cardId: result.userCard.cardId,
        status: result.userCard.status,
        quantity: result.userCard.quantity,
      },
      ...(result.updatedTotalPages !== undefined
        ? { updatedTotalPages: result.updatedTotalPages }
        : {}),
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
