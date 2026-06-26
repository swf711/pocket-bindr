import { CardStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveCanonicalCardId } from '@/lib/resolve-canonical-card'
import { GRID_TYPE_SLOTS } from '@/types/binder'
import { revalidatePublicBinder } from '@/lib/binder-cache'

type RouteContext = { params: Promise<{ id: string }> }

const VALID_STATUSES = new Set<CardStatus>(['owned', 'wanted'])

/**
 * Creates a single BinderSlot at a specific (pageNumber, slotIndex) — the
 * "slot-driven add" flow. Empty slots have no BinderSlot row in the DB
 * (see buildGridPages); this is the first time a row is created for that
 * position, as opposed to POST /api/binders/[id]/cards which auto-fills
 * the first available empty position.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
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

    const { pageNumber, slotIndex, cardId, status } = body as Record<string, unknown>

    const slotsPerPage = GRID_TYPE_SLOTS[binder.gridType]
    if (
      typeof pageNumber !== 'number' ||
      !Number.isInteger(pageNumber) ||
      pageNumber < 1
    ) {
      return Response.json({ error: 'pageNumber must be a positive integer' }, { status: 400 })
    }
    if (
      typeof slotIndex !== 'number' ||
      !Number.isInteger(slotIndex) ||
      slotIndex < 0 ||
      slotIndex >= slotsPerPage
    ) {
      return Response.json({ error: 'slotIndex out of range' }, { status: 400 })
    }
    if (typeof cardId !== 'string' || !cardId) {
      return Response.json({ error: 'cardId is required' }, { status: 400 })
    }
    if (!VALID_STATUSES.has(status as CardStatus)) {
      return Response.json({ error: "status must be 'owned' or 'wanted'" }, { status: 400 })
    }
    const typedStatus = status as CardStatus

    const existing = await prisma.binderSlot.findUnique({
      where: { binderId_pageNumber_slotIndex: { binderId, pageNumber, slotIndex } },
    })
    if (existing) {
      return Response.json({ error: 'Slot already has a card' }, { status: 400 })
    }

    const resolved = await resolveCanonicalCardId(prisma, cardId)
    if (resolved.status === 'not_found') {
      return Response.json({ error: 'Card not found' }, { status: 404 })
    }
    if (resolved.status === 'canonical_missing') {
      return Response.json({ error: 'Canonical card not found' }, { status: 404 })
    }
    const resolvedCardId = resolved.resolvedCardId

    const result = await prisma.$transaction(async (tx) => {
      const userCard = await tx.userCard.upsert({
        where: { userId_cardId_status: { userId, cardId: resolvedCardId, status: typedStatus } },
        create: { userId, cardId: resolvedCardId, status: typedStatus, quantity: 1 },
        update: { quantity: { increment: 1 } },
      })

      const createdSlot = await tx.binderSlot.create({
        data: { binderId, pageNumber, slotIndex, cardId: resolvedCardId, status: typedStatus },
        include: {
          card: {
            select: { id: true, name: true, imageSmall: true, language: true, cardNumber: true, rarity: true },
          },
        },
      })

      return { userCard, createdSlot }
    })

    revalidatePublicBinder(binder.shareToken)
    return Response.json({
      slot: {
        id: result.createdSlot.id,
        pageNumber: result.createdSlot.pageNumber,
        slotIndex: result.createdSlot.slotIndex,
        status: result.createdSlot.status,
        card: result.createdSlot.card,
      },
      userCard: {
        id: result.userCard.id,
        cardId: result.userCard.cardId,
        status: result.userCard.status,
        quantity: result.userCard.quantity,
      },
    })
  } catch (err) {
    console.error('[POST /api/binders/[id]/slots]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
