import { Prisma } from '@prisma/client'
import type { PlanSlotShiftResult } from '@/lib/binder-slot-placement'

type PlannedShift = Extract<PlanSlotShiftResult, { status: 'planned' }>

/**
 * 把 `planSlotInsertion` / `planSlotRemoval` 算出的位移實際寫入 DB。
 *
 * 🔴 **一律批次 SQL，不可退回逐格 `binderSlot.update`**：位移範圍可達整本卡冊
 * （100 頁 × 16 格），逐格更新在兩段式手法下是 2N 次序列 round-trip——實測那正是
 * 「點下去像沒反應」的根因（30 頁卡冊插入一格＝216 次往返）。這裡固定只發 2 個 statement，
 * 與位移格數無關。
 *
 * 兩段式的理由與 `slots/swap`、`pages/reorder-bulk` 相同：直接落位會中途撞
 * `@@unique([binderId, pageNumber, slotIndex])`。取負 pageNumber 當暫時座標既保持
 * 彼此唯一（原座標本身唯一），也不可能與未移動的正頁碼相撞。
 *
 * ⚠️ server-only：本檔 import `Prisma`（`Prisma.sql` 不可進 client bundle）。
 * 純函式那一半留在 `binder-slot-placement.ts`，client 仍可安全 import。
 */
export async function applySlotShift(
  tx: Prisma.TransactionClient,
  binderId: string,
  plan: PlannedShift,
): Promise<void> {
  const { moves, collapsedGroupIds, removedSlotIds } = plan

  // 收合群組：只留 anchor，其餘成員刪除（quantity 不變，anchor 仍在）
  if (removedSlotIds.length > 0) {
    await tx.binderSlot.deleteMany({ where: { binderId, id: { in: removedSlotIds } } })
  }
  if (collapsedGroupIds.length > 0) {
    await tx.binderSlot.updateMany({
      where: { binderId, groupId: { in: collapsedGroupIds } },
      data: { groupId: null, groupIndex: null },
    })
    await tx.binderSlotGroup.deleteMany({ where: { binderId, id: { in: collapsedGroupIds } } })
  }

  if (moves.length === 0) return

  // 目標格若有殘留的空 row（cardId 為 null），先讓位
  const targetsByPage = new Map<number, number[]>()
  for (const move of moves) {
    const list = targetsByPage.get(move.pageNumber) ?? []
    list.push(move.slotIndex)
    targetsByPage.set(move.pageNumber, list)
  }
  for (const [pageNumber, slotIndex] of targetsByPage) {
    await tx.binderSlot.deleteMany({
      where: { binderId, cardId: null, pageNumber, slotIndex: { in: slotIndex } },
    })
  }

  const ids = moves.map((m) => m.id)

  // ① 一次挪到暫時座標
  await tx.$executeRaw`
    UPDATE "BinderSlot"
    SET "pageNumber" = -"pageNumber"
    WHERE "binderId" = ${binderId} AND "id" IN (${Prisma.join(ids)})
  `

  // ② 一次落位
  const values = Prisma.join(
    moves.map((m) => Prisma.sql`(${m.id}, ${m.pageNumber}::int, ${m.slotIndex}::int)`),
  )
  await tx.$executeRaw`
    UPDATE "BinderSlot" AS s
    SET "pageNumber" = v."pageNumber", "slotIndex" = v."slotIndex"
    FROM (VALUES ${values}) AS v("id", "pageNumber", "slotIndex")
    WHERE s."id" = v."id" AND s."binderId" = ${binderId}
  `
}
