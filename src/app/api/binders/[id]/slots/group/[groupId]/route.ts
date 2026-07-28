import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { GRID_TYPE_COLS, GRID_TYPE_SLOTS } from '@/types/binder'
import { groupSlotIndices } from '@/lib/binder-slot-placement'
import { slotPositionSchema } from '@/lib/schemas/binder'

type RouteContext = { params: Promise<{ id: string; groupId: string }> }

/**
 * 整組搬移跨格群組（拖拉重排）。body 的 (pageNumber, slotIndex) 是**左上角**位置。
 *
 * 只接受「目標矩形除自己外全空」，不支援與單格互換、不自動讓位（見核心設計決策）。
 * 位移採既有 swap route 的手法：先把整組挪到不可能相撞的暫時座標，再落到目標位置，
 * 避免中途撞到 `@@unique([binderId, pageNumber, slotIndex])`。
 */
export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: binderId, groupId } = await context.params

  const binder = await prisma.binder.findUnique({ where: { id: binderId } })
  if (!binder) return Response.json({ error: 'Not found' }, { status: 404 })
  if (binder.userId !== session.user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

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

  const group = await prisma.binderSlotGroup.findUnique({
    where: { id: groupId },
    include: { slots: { orderBy: { groupIndex: 'asc' } } },
  })
  if (!group || group.binderId !== binderId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const slotsPerPage = GRID_TYPE_SLOTS[binder.gridType]
  const gridCols = GRID_TYPE_COLS[binder.gridType]
  const gridRows = Math.floor(slotsPerPage / gridCols)
  const baseRow = Math.floor(slotIndex / gridCols)
  const baseCol = slotIndex % gridCols
  if (baseCol + group.cols > gridCols || baseRow + group.rows > gridRows) {
    return Response.json({ error: 'targetOutOfBounds' }, { status: 400 })
  }

  const targetIndices = groupSlotIndices(slotIndex, group.cols, group.rows, gridCols)
  const memberIds = new Set(group.slots.map((s) => s.id))

  const blocking = await prisma.binderSlot.findMany({
    where: {
      binderId,
      pageNumber,
      slotIndex: { in: targetIndices },
      cardId: { not: null },
      id: { notIn: [...memberIds] },
    },
    select: { id: true },
  })
  if (blocking.length > 0) {
    return Response.json({ error: 'targetOccupied' }, { status: 409 })
  }

  await prisma.$transaction(async (tx) => {
    // 目標格若已有空 row（無卡），先讓出位置給群組成員
    await tx.binderSlot.deleteMany({
      where: {
        binderId,
        pageNumber,
        slotIndex: { in: targetIndices },
        cardId: null,
        id: { notIn: [...memberIds] },
      },
    })

    // 暫時座標：pageNumber 取負值，與任何合法頁碼不相撞
    for (const [i, slot] of group.slots.entries()) {
      await tx.binderSlot.update({
        where: { id: slot.id },
        data: { pageNumber: -1, slotIndex: -(i + 1) },
      })
    }
    for (const [i, slot] of group.slots.entries()) {
      await tx.binderSlot.update({
        where: { id: slot.id },
        data: { pageNumber, slotIndex: targetIndices[i] },
      })
    }
  })

  revalidatePublicBinder(binder.shareToken)
  return Response.json({
    groupId,
    slots: group.slots.map((slot, i) => ({
      id: slot.id,
      pageNumber,
      slotIndex: targetIndices[i],
    })),
  })
}
