import { CardStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveCanonicalCardId, deriveDisplayCardId } from '@/lib/resolve-canonical-card'
import { GRID_TYPE_SLOTS } from '@/types/binder'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { slotDisplaySelect, toDisplaySlot } from '@/lib/slot-display'
import { slotCreateSchema } from '@/lib/schemas/binder'

type RouteContext = { params: Promise<{ id: string }> }

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
    if (!slotCreateSchema.shape.pageNumber.safeParse(pageNumber).success) {
      return Response.json({ error: 'pageNumber must be a positive integer' }, { status: 400 })
    }
    const typedPageNumber = pageNumber as number
    if (
      !slotCreateSchema.shape.slotIndex.safeParse(slotIndex).success ||
      (slotIndex as number) >= slotsPerPage
    ) {
      return Response.json({ error: 'slotIndex out of range' }, { status: 400 })
    }
    const typedSlotIndex = slotIndex as number
    if (!slotCreateSchema.shape.cardId.safeParse(cardId).success) {
      return Response.json({ error: 'cardId is required' }, { status: 400 })
    }
    const statusResult = slotCreateSchema.shape.status.safeParse(status)
    if (!statusResult.success) {
      return Response.json({ error: "status must be 'owned' or 'wanted'" }, { status: 400 })
    }
    const typedStatus = statusResult.data
    const typedCardId = cardId as string

    const existing = await prisma.binderSlot.findUnique({
      where: { binderId_pageNumber_slotIndex: { binderId, pageNumber: typedPageNumber, slotIndex: typedSlotIndex } },
    })
    if (existing) {
      return Response.json({ error: 'Slot already has a card' }, { status: 400 })
    }

    const resolved = await resolveCanonicalCardId(prisma, typedCardId)
    if (resolved.status === 'not_found') {
      return Response.json({ error: 'Card not found' }, { status: 404 })
    }
    if (resolved.status === 'canonical_missing') {
      return Response.json({ error: 'Canonical card not found' }, { status: 404 })
    }
    const resolvedCardId = resolved.resolvedCardId
    // 保留原始顯示語言（OPCG ZH_TW alias）；純 canonical 則 null
    const displayCardId = deriveDisplayCardId(typedCardId, resolvedCardId)

    const result = await prisma.$transaction(async (tx) => {
      const userCard = await tx.userCard.upsert({
        where: { userId_cardId_status: { userId, cardId: resolvedCardId, status: typedStatus } },
        create: { userId, cardId: resolvedCardId, status: typedStatus, quantity: 1, displayCardId },
        update: { quantity: { increment: 1 } },
      })

      const createdSlot = await tx.binderSlot.create({
        data: { binderId, pageNumber: typedPageNumber, slotIndex: typedSlotIndex, cardId: resolvedCardId, status: typedStatus, displayCardId },
        select: slotDisplaySelect,
      })

      return { userCard, createdSlot }
    })

    const displaySlot = toDisplaySlot(result.createdSlot)
    revalidatePublicBinder(binder.shareToken)
    return Response.json({
      slot: {
        id: displaySlot.id,
        pageNumber: displaySlot.pageNumber,
        slotIndex: displaySlot.slotIndex,
        status: displaySlot.status,
        card: displaySlot.card,
      },
      userCard: {
        id: result.userCard.id,
        cardId: displaySlot.cardId,
        status: result.userCard.status,
        quantity: result.userCard.quantity,
      },
    })
  } catch (err) {
    console.error('[POST /api/binders/[id]/slots]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
