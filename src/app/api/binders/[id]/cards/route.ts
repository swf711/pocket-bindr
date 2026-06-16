import { CardStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GRID_TYPE_SLOTS } from '@/types/binder'
import { resolveCanonicalCardId } from '@/lib/resolve-canonical-card'

type RouteContext = { params: Promise<{ id: string }> }

const VALID_STATUSES = new Set<CardStatus>(['owned', 'wanted'])

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

  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return Response.json({ error: 'quantity must be an integer between 1 and 99' }, { status: 400 })
  }

  if (!VALID_STATUSES.has(status as CardStatus)) {
    return Response.json({ error: "status must be 'owned' or 'wanted'" }, { status: 400 })
  }

  const typedCardId = resolved.resolvedCardId
  const typedStatus = status as CardStatus
  const typedQuantity = quantity as number

  const slotsPerPage = GRID_TYPE_SLOTS[binder.gridType]

  const result = await prisma.$transaction(async (tx) => {
    const userCard = await tx.userCard.upsert({
      where: { userId_cardId_status: { userId, cardId: typedCardId, status: typedStatus } },
      create: { userId, cardId: typedCardId, status: typedStatus, quantity: typedQuantity },
      update: { quantity: { increment: typedQuantity } },
    })

    const emptySlots = await tx.binderSlot.findMany({
      where: { binderId, cardId: null },
      orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
      take: typedQuantity,
    })

    const slotsToFill = emptySlots.length
    const slotsToCreate = typedQuantity - slotsToFill

    if (slotsToFill > 0) {
      await Promise.all(
        emptySlots.map((slot) =>
          tx.binderSlot.update({
            where: { id: slot.id },
            data: { cardId: typedCardId, status: typedStatus },
          }),
        ),
      )
    }

    let updatedTotalPages: number | undefined

    if (slotsToCreate > 0) {
      const lastSlot = await tx.binderSlot.findFirst({
        where: { binderId },
        orderBy: [{ pageNumber: 'desc' }, { slotIndex: 'desc' }],
      })

      let nextPage = 1
      let nextIndex = 0

      if (lastSlot) {
        nextIndex = lastSlot.slotIndex + 1
        nextPage = lastSlot.pageNumber
        if (nextIndex >= slotsPerPage) {
          nextIndex = 0
          nextPage = nextPage + 1
        }
      }

      const newSlots: {
        binderId: string
        cardId: string
        status: CardStatus
        pageNumber: number
        slotIndex: number
      }[] = []

      for (let i = 0; i < slotsToCreate; i++) {
        newSlots.push({
          binderId,
          cardId: typedCardId,
          status: typedStatus,
          pageNumber: nextPage,
          slotIndex: nextIndex,
        })
        nextIndex++
        if (nextIndex >= slotsPerPage) {
          nextIndex = 0
          nextPage++
        }
      }

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
}
