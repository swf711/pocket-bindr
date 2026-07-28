import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePublicBinder } from '@/lib/binder-cache'
import { GRID_TYPE_COLS, GRID_TYPE_SLOTS } from '@/types/binder'
import { expandSlotToSpan, loadSpanLayoutForCard, resolveTotalPages } from '@/lib/binder-span'
import { toDisplaySlot } from '@/lib/slot-display'

type RouteContext = { params: Promise<{ id: string; slotId: string }> }

const layoutSchema = z.object({ mode: z.enum(['span', 'single']) })

class SpanUnavailableError extends Error {}

/**
 * 切換單一複數卡在卡冊內的呈現方式：跨 N 格（每格顯示合成圖的一塊）↔ 佔 1 格（整張合成圖）。
 *
 * `span → single`：留下 anchor（groupIndex 0）那格，其餘成員格位刪除、群組解散。
 * UserCard.quantity 不動——本來就只有 anchor 計數（見 binder-utils 的 isCountableSlot）。
 *
 * `single → span`：以該格為左上角試建群組，同頁其他位置遞補，全卡冊都放不下才回 409。
 */
export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: binderId, slotId } = await context.params

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
  const parsed = layoutSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "mode must be 'span' or 'single'" }, { status: 400 })
  }
  const { mode } = parsed.data

  const slot = await prisma.binderSlot.findUnique({ where: { id: slotId } })
  if (!slot || slot.binderId !== binderId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  if (!slot.cardId || !slot.status) {
    return Response.json({ error: 'Slot has no card' }, { status: 400 })
  }

  const slotsPerPage = GRID_TYPE_SLOTS[binder.gridType]
  const gridCols = GRID_TYPE_COLS[binder.gridType]

  if (mode === 'single') {
    if (!slot.groupId) return Response.json({ error: 'alreadySingle' }, { status: 409 })
    const groupId = slot.groupId

    const result = await prisma.$transaction(async (tx) => {
      const members = await tx.binderSlot.findMany({
        where: { binderId, groupId },
        orderBy: { groupIndex: 'asc' },
      })
      const anchor = members[0]
      const removedSlotIds = members.slice(1).map((m) => m.id)
      await tx.binderSlot.deleteMany({ where: { id: { in: removedSlotIds } } })
      await tx.binderSlot.update({
        where: { id: anchor.id },
        data: { groupId: null, groupIndex: null },
      })
      await tx.binderSlotGroup.delete({ where: { id: groupId } })
      return { anchorId: anchor.id, removedSlotIds }
    })

    revalidatePublicBinder(binder.shareToken)
    return Response.json({ mode: 'single', ...result })
  }

  if (slot.groupId) return Response.json({ error: 'alreadySpanned' }, { status: 409 })

  const layout = await loadSpanLayoutForCard(prisma, slot.cardId, gridCols, slotsPerPage)
  if (!layout) return Response.json({ error: 'spanUnsupported' }, { status: 409 })

  try {
    const members = await prisma.$transaction(async (tx) => {
      const created = await expandSlotToSpan(tx, {
        binderId,
        slot: {
          id: slot.id,
          pageNumber: slot.pageNumber,
          slotIndex: slot.slotIndex,
          cardId: slot.cardId!,
          displayCardId: slot.displayCardId,
          status: slot.status!,
        },
        layout,
        gridCols,
        slotsPerPage,
        totalPages: await resolveTotalPages(tx, binderId, binder.settings),
      })
      if (!created) throw new SpanUnavailableError()
      return created
    })

    revalidatePublicBinder(binder.shareToken)
    // 回傳全部成員，前端可直接套用、不需再打一次 GET /api/binders/[id]
    return Response.json({ mode: 'span', slots: members.map(toDisplaySlot) })
  } catch (err) {
    if (err instanceof SpanUnavailableError) {
      return Response.json({ error: 'noRoomForSpan' }, { status: 409 })
    }
    throw err
  }
}
