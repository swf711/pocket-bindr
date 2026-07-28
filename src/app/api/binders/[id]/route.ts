import { GridType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrementUserCardsForSlots, repackSlotsForGridChange } from '@/lib/binder-utils'
import { GRID_TYPE_COLS, GRID_TYPE_SLOTS } from '@/types/binder'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { slotDisplaySelect, toDisplaySlot } from '@/lib/slot-display'
import { GRID_TYPE_VALUES, hexColorSchema } from '@/lib/schemas/common'
import { binderUpdateSchema } from '@/lib/schemas/binder'

type RouteContext = { params: Promise<{ id: string }> }

async function getBinderOrError(id: string, userId: string) {
  const binder = await prisma.binder.findUnique({ where: { id } })
  if (!binder) {
    return { binder: null, error: Response.json({ error: 'Not found' }, { status: 404 }) }
  }
  if (binder.userId !== userId) {
    return { binder: null, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { binder, error: null }
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await context.params
  const { error } = await getBinderOrError(id, session.user.id)
  if (error) return error

  const binderWithSlots = await prisma.binder.findUnique({
    where: { id },
    include: {
      slots: {
        where: { cardId: { not: null } },
        orderBy: [{ pageNumber: 'asc' }, { slotIndex: 'asc' }],
        select: slotDisplaySelect,
      },
    },
  })

  const rawSettings = binderWithSlots!.settings as { totalPages?: number } | null
  const maxPageFromSlots = binderWithSlots!.slots.reduce((max, s) => Math.max(max, s.pageNumber), 0)
  const totalPages = Math.max(rawSettings?.totalPages ?? 0, maxPageFromSlots, 1)

  return Response.json({
    id: binderWithSlots!.id,
    name: binderWithSlots!.name,
    gridType: binderWithSlots!.gridType,
    coverColor: binderWithSlots!.coverColor,
    totalPages,
    slots: binderWithSlots!.slots.map(toDisplaySlot),
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const { id } = await context.params

  const { binder: currentBinder, error } = await getBinderOrError(id, userId)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, gridType, coverColor, description } = body as Record<string, unknown>
  const updateData: { name?: string; gridType?: GridType; coverColor?: string; description?: string | null } = {}

  if (name !== undefined) {
    if (!binderUpdateSchema.shape.name.unwrap().safeParse(name).success) {
      return Response.json(
        { error: 'name must be a non-empty string of at most 50 characters' },
        { status: 400 },
      )
    }
    updateData.name = (name as string).trim()
  }

  if (gridType !== undefined) {
    if (!binderUpdateSchema.shape.gridType.unwrap().safeParse(gridType).success) {
      return Response.json(
        { error: `gridType must be one of: ${GRID_TYPE_VALUES.join(', ')}` },
        { status: 400 },
      )
    }
    updateData.gridType = gridType as GridType
  }

  if (coverColor !== undefined) {
    if (!hexColorSchema.safeParse(coverColor).success) {
      return Response.json({ error: 'coverColor must be a valid hex color (e.g. #4A5568)' }, { status: 400 })
    }
    updateData.coverColor = coverColor as string
  }

  if (description !== undefined) {
    if (typeof description !== 'string' && description !== null) {
      return Response.json({ error: 'description must be a string or null' }, { status: 400 })
    }
    if (typeof description === 'string' && description.trim().length > 150) {
      return Response.json({ error: 'description must be at most 150 characters' }, { status: 400 })
    }
    updateData.description = typeof description === 'string' ? description.trim() || null : null
  }

  // 格式變更時重新配置格位。
  // ⚠️ 不只「變小」需要處理——欄數一改，跨格群組原本相鄰的格位就會散開
  //（3×3 的 2×2 群組佔 index {0,1,3,4}，換到 4 欄後不再是矩形），故變大也要重裝箱。
  const newGridType = updateData.gridType

  if (newGridType !== undefined && newGridType !== currentBinder!.gridType) {
    const newSlotsPerPage = GRID_TYPE_SLOTS[newGridType]
    const newGridCols = GRID_TYPE_COLS[newGridType]
    const currentSettings = currentBinder!.settings as { totalPages?: number } | null
    const currentTotalPages = Math.max(currentSettings?.totalPages ?? 0, 1)

    const [slots, groups] = await Promise.all([
      prisma.binderSlot.findMany({
        where: { binderId: id },
        select: { id: true, pageNumber: true, slotIndex: true, groupId: true, groupIndex: true },
      }),
      prisma.binderSlotGroup.findMany({
        where: { binderId: id },
        select: { id: true, cols: true, rows: true },
      }),
    ])

    const repack = repackSlotsForGridChange({
      slots,
      groups,
      newGridCols,
      newSlotsPerPage,
      currentTotalPages,
    })

    if (
      repack.moves.length > 0 ||
      repack.dissolvedGroupIds.length > 0 ||
      repack.removedSlotIds.length > 0
    ) {
      const currentSettingsObj = (currentBinder!.settings as Record<string, unknown>) ?? {}
      const newSettings = { ...currentSettingsObj, totalPages: repack.totalPages }

      const updated = await prisma.$transaction(async (tx) => {
        if (repack.dissolvedGroupIds.length > 0) {
          // 拆組只留 anchor（其餘成員是同一張實體卡的其他區塊，全留會讓
          // 格位數與 UserCard.quantity 對不上，見 RepackResult.removedSlotIds）
          await tx.binderSlot.deleteMany({ where: { id: { in: repack.removedSlotIds } } })
          await tx.binderSlot.updateMany({
            where: { binderId: id, groupId: { in: repack.dissolvedGroupIds } },
            data: { groupId: null, groupIndex: null },
          })
          await tx.binderSlotGroup.deleteMany({
            where: { id: { in: repack.dissolvedGroupIds } },
          })
        }

        // 兩段式位移：先挪到不可能相撞的暫時座標，再落到目標位置，
        // 避免中途撞 @@unique([binderId, pageNumber, slotIndex])（沿用 swap route 的手法）
        for (const [i, move] of repack.moves.entries()) {
          await tx.binderSlot.update({
            where: { id: move.id },
            data: { pageNumber: -1, slotIndex: -(i + 1) },
          })
        }
        for (const move of repack.moves) {
          await tx.binderSlot.update({
            where: { id: move.id },
            data: { pageNumber: move.pageNumber, slotIndex: move.slotIndex },
          })
        }

        return tx.binder.update({
          where: { id },
          data: { ...updateData, settings: newSettings },
          include: { _count: { select: { slots: true } } },
        })
      })

      revalidatePublicBinder(currentBinder!.shareToken)
      return Response.json({
        ...updated,
        affectedSlotsCount: repack.moves.length,
        dissolvedGroupCount: repack.dissolvedGroupIds.length,
      })
    }
  }

  const updated = await prisma.binder.update({
    where: { id },
    data: updateData,
    include: { _count: { select: { slots: true } } },
  })

  revalidatePublicBinder(currentBinder!.shareToken)
  return Response.json(updated)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id
  const { id } = await context.params

  const { binder, error } = await getBinderOrError(id, userId)
  if (error) return error

  await prisma.$transaction(async (tx) => {
    const slots = await tx.binderSlot.findMany({
      where: { binderId: id, cardId: { not: null } },
      select: { cardId: true, status: true },
    })
    await decrementUserCardsForSlots(tx, userId, slots)
    await tx.binder.delete({ where: { id } })
  })

  revalidatePublicBinder(binder!.shareToken)
  return new Response(null, { status: 204 })
}
