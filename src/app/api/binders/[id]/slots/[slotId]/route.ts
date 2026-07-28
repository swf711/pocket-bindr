import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrementUserCardsForSlots } from '@/lib/binder-utils'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { slotPositionSchema } from '@/lib/schemas/binder'

type RouteContext = { params: Promise<{ id: string; slotId: string }> }

async function getBinderAndSlot(binderId: string, slotId: string, userId: string) {
  const binder = await prisma.binder.findUnique({ where: { id: binderId } })
  if (!binder) {
    return { binder: null, slot: null, error: Response.json({ error: 'Not found' }, { status: 404 }) }
  }
  if (binder.userId !== userId) {
    return { binder: null, slot: null, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  const slot = await prisma.binderSlot.findUnique({ where: { id: slotId } })
  if (!slot || slot.binderId !== binderId) {
    return { binder, slot: null, error: Response.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { binder, slot, error: null }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const { id: binderId, slotId } = await context.params
  const { binder, slot, error } = await getBinderAndSlot(binderId, slotId, userId)
  if (error) return error

  // 跨格群組是一張實體卡的多個區塊，刪除任一格＝刪整組（quantity 只扣 1，
  // 由 decrementUserCardsForSlots 依 groupIndex 過濾）
  const groupId = slot!.groupId

  const removedSlotIds = await prisma.$transaction(async (tx) => {
    const targets = groupId
      ? await tx.binderSlot.findMany({ where: { binderId, groupId } })
      : [slot!]

    await tx.binderSlot.deleteMany({ where: { id: { in: targets.map((s) => s.id) } } })
    if (groupId) await tx.binderSlotGroup.delete({ where: { id: groupId } })
    await decrementUserCardsForSlots(tx, userId, targets)
    return targets.map((s) => s.id)
  })

  revalidatePublicBinder(binder!.shareToken)
  return Response.json({ deleted: true, removedSlotIds })
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: binderId, slotId } = await context.params
  const { binder, slot, error } = await getBinderAndSlot(binderId, slotId, session.user.id)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = slotPositionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'pageNumber and slotIndex are required numbers' }, { status: 400 })
  }
  const { pageNumber, slotIndex } = parsed.data

  // 跨格群組必須整組搬移，單格移動會拆散矩形 → 走 /slots/group/[groupId]
  if (slot!.groupId) {
    return Response.json({ error: 'slotBelongsToGroup' }, { status: 409 })
  }

  const updated = await prisma.binderSlot.update({
    where: { id: slotId },
    data: { pageNumber, slotIndex },
    select: { id: true, pageNumber: true, slotIndex: true },
  })
  revalidatePublicBinder(binder!.shareToken)
  return Response.json(updated)
}
