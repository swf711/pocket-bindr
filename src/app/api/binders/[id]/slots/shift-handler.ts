import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { MAX_PAGES_PER_BINDER } from '@/lib/binder-limits'
import { applySlotShift } from '@/lib/binder-slot-shift'
import type { PlanSlotInsertionInput, PlanSlotShiftResult } from '@/lib/binder-slot-placement'
import { slotPositionSchema } from '@/lib/schemas/binder'
import { GRID_TYPE_COLS, GRID_TYPE_SLOTS } from '@/types/binder'

const groupModeSchema = z.enum(['shift', 'collapse']).optional()

type Planner = (input: PlanSlotInsertionInput) => PlanSlotShiftResult

/**
 * 「插入空格」與「移除空格」共用的 route 實作——兩者只差傳進來的 planner
 * （`planSlotInsertion` / `planSlotRemoval`），auth、驗證、錯誤碼、寫入與快取失效完全相同。
 *
 * 🔴 **一律以伺服器端自己讀到的資料重算**，不信任 client 傳來的判斷；client 也算一次，
 * 但那是為了樂觀更新與「要不要先問使用者跨格群組怎麼辦」，不是真相來源。
 */
export async function handleSlotShift(
  request: Request,
  context: { params: Promise<{ id: string }> },
  plannerFor: Planner,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: binderId } = await context.params

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
  const groupModeParsed = groupModeSchema.safeParse((body as Record<string, unknown>).groupMode)
  if (!groupModeParsed.success) {
    return Response.json({ error: "groupMode must be 'shift' or 'collapse'" }, { status: 400 })
  }
  const { pageNumber, slotIndex } = parsed.data

  const slotsPerPage = GRID_TYPE_SLOTS[binder.gridType]
  const gridCols = GRID_TYPE_COLS[binder.gridType]
  if (pageNumber < 1 || slotIndex < 0 || slotIndex >= slotsPerPage) {
    return Response.json({ error: 'slotIndex out of range' }, { status: 400 })
  }

  const [slots, groups] = await Promise.all([
    prisma.binderSlot.findMany({
      where: { binderId, cardId: { not: null } },
      select: { id: true, pageNumber: true, slotIndex: true, groupId: true, groupIndex: true },
    }),
    prisma.binderSlotGroup.findMany({
      where: { binderId },
      select: { id: true, cols: true, rows: true },
    }),
  ])

  const settings = (binder.settings as Record<string, unknown> | null) ?? {}
  const storedTotalPages = typeof settings.totalPages === 'number' ? settings.totalPages : 0
  const maxPageFromSlots = slots.reduce((max, s) => Math.max(max, s.pageNumber), 0)
  const totalPages = Math.max(storedTotalPages, maxPageFromSlots, 1)

  const plan = plannerFor({
    slots,
    groups,
    gridCols,
    slotsPerPage,
    totalPages,
    insertAt: { pageNumber, slotIndex },
    groupMode: groupModeParsed.data,
  })

  if (plan.status === 'pageLimit') {
    return Response.json({ error: 'pageLimitReached', max: MAX_PAGES_PER_BINDER }, { status: 409 })
  }
  if (plan.status === 'blockedByGroup') {
    return Response.json({ error: 'insertBlockedByGroup', groupIds: plan.groupIds }, { status: 409 })
  }
  if (plan.status === 'noop') {
    return Response.json({ movedSlotIds: [], removedSlotIds: [], totalPages })
  }

  await prisma.$transaction(async (tx) => {
    await applySlotShift(tx, binderId, plan)

    if (plan.newTotalPages > totalPages) {
      await tx.binder.update({
        where: { id: binderId },
        data: { settings: { ...settings, totalPages: plan.newTotalPages } },
      })
    }
  })

  revalidatePublicBinder(binder.shareToken)
  return Response.json({
    movedSlotIds: plan.moves.map((m) => m.id),
    removedSlotIds: plan.removedSlotIds,
    totalPages: plan.newTotalPages,
  })
}
