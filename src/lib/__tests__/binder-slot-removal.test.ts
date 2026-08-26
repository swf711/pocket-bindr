import { describe, it, expect } from 'vitest'
import {
  planSlotInsertion,
  planSlotRemoval,
  type InsertionSlot,
} from '../binder-slot-placement'

const GRID_COLS = 3
const SLOTS_PER_PAGE = 9

function slot(pageNumber: number, slotIndex: number, extra: Partial<InsertionSlot> = {}): InsertionSlot {
  return {
    id: `p${pageNumber}s${slotIndex}`,
    pageNumber,
    slotIndex,
    groupId: null,
    groupIndex: null,
    ...extra,
  }
}

function plan(
  fn: typeof planSlotRemoval,
  input: Partial<Parameters<typeof planSlotRemoval>[0]> & {
    slots: InsertionSlot[]
    insertAt: { pageNumber: number; slotIndex: number }
  },
) {
  return fn({
    groups: [],
    gridCols: GRID_COLS,
    slotsPerPage: SLOTS_PER_PAGE,
    totalPages: 1,
    ...input,
  })
}

describe('planSlotRemoval', () => {
  it('目標格有卡 → noop（只能移除空格）', () => {
    const result = plan(planSlotRemoval, {
      slots: [slot(1, 0)],
      insertAt: { pageNumber: 1, slotIndex: 0 },
    })
    expect(result.status).toBe('noop')
  })

  it('空格之後沒有卡可遞補 → noop', () => {
    const result = plan(planSlotRemoval, {
      slots: [slot(1, 0)],
      insertAt: { pageNumber: 1, slotIndex: 3 },
    })
    expect(result.status).toBe('noop')
  })

  it('移除中間空格 → 後面連續 3 張各往前一格，第二個空位之後不動', () => {
    const slots = [slot(1, 0), slot(1, 2), slot(1, 3), slot(1, 4), slot(1, 7)]
    const result = plan(planSlotRemoval, { slots, insertAt: { pageNumber: 1, slotIndex: 1 } })
    if (result.status !== 'planned') throw new Error(result.status)

    expect(result.moves).toEqual([
      { id: 'p1s2', pageNumber: 1, slotIndex: 1 },
      { id: 'p1s3', pageNumber: 1, slotIndex: 2 },
      { id: 'p1s4', pageNumber: 1, slotIndex: 3 },
    ])
    // index 5、6 是空的，index 7 的卡不受影響
    expect(result.moves.some((m) => m.id === 'p1s7')).toBe(false)
  })

  it('往前遞補跨頁：下一頁第 0 格拉回上一頁最後一格', () => {
    const slots = [
      ...Array.from({ length: 8 }, (_, i) => slot(1, i)).filter((s) => s.slotIndex !== 8),
      slot(2, 0),
    ]
    // 第 1 頁 index 0–7 有卡、index 8 空；第 2 頁 index 0 有卡
    const result = plan(planSlotRemoval, {
      slots,
      totalPages: 2,
      insertAt: { pageNumber: 1, slotIndex: 8 },
    })
    if (result.status !== 'planned') throw new Error(result.status)

    expect(result.moves).toEqual([{ id: 'p2s0', pageNumber: 1, slotIndex: 8 }])
    expect(result.newTotalPages).toBe(2)
  })

  it('不增頁也不刪頁：newTotalPages 恆等於輸入值', () => {
    const slots = [slot(1, 1), slot(2, 0)]
    const result = plan(planSlotRemoval, {
      slots,
      totalPages: 5,
      insertAt: { pageNumber: 1, slotIndex: 0 },
    })
    if (result.status !== 'planned') throw new Error(result.status)
    expect(result.newTotalPages).toBe(5)
  })

  describe('跨格群組', () => {
    const groups = [{ id: 'grp', cols: 2, rows: 1 }]
    /** 2×1 群組佔 index 4、5（第 2 列的第 2、3 欄） */
    const groupSlots: InsertionSlot[] = [
      { id: 'g0', pageNumber: 1, slotIndex: 4, groupId: 'grp', groupIndex: 0 },
      { id: 'g1', pageNumber: 1, slotIndex: 5, groupId: 'grp', groupIndex: 1 },
    ]

    it('範圍內有群組且未帶 groupMode → blockedByGroup', () => {
      const result = plan(planSlotRemoval, {
        slots: groupSlots,
        groups,
        insertAt: { pageNumber: 1, slotIndex: 3 },
      })
      expect(result).toEqual({ status: 'blockedByGroup', groupIds: ['grp'] })
    })

    it('shift：群組整組往前移到空出來的位置', () => {
      const result = plan(planSlotRemoval, {
        slots: groupSlots,
        groups,
        groupMode: 'shift',
        insertAt: { pageNumber: 1, slotIndex: 3 },
      })
      if (result.status !== 'planned') throw new Error(result.status)
      expect(result.moves).toEqual([
        { id: 'g0', pageNumber: 1, slotIndex: 3 },
        { id: 'g1', pageNumber: 1, slotIndex: 4 },
      ])
    })

    it('shift：群組往回會跨列時原地不動 → noop（不硬拆矩形）', () => {
      // 群組佔 index 3、4（第 2 列開頭），空格在 index 2（第 1 列尾）
      const rowStartGroup: InsertionSlot[] = [
        { id: 'g0', pageNumber: 1, slotIndex: 3, groupId: 'grp', groupIndex: 0 },
        { id: 'g1', pageNumber: 1, slotIndex: 4, groupId: 'grp', groupIndex: 1 },
      ]
      const result = plan(planSlotRemoval, {
        slots: rowStartGroup,
        groups,
        groupMode: 'shift',
        insertAt: { pageNumber: 1, slotIndex: 2 },
      })
      expect(result.status).toBe('noop')
    })

    it('collapse：只留 anchor，其餘進 removedSlotIds', () => {
      const result = plan(planSlotRemoval, {
        slots: groupSlots,
        groups,
        groupMode: 'collapse',
        insertAt: { pageNumber: 1, slotIndex: 3 },
      })
      if (result.status !== 'planned') throw new Error(result.status)
      expect(result.collapsedGroupIds).toEqual(['grp'])
      expect(result.removedSlotIds).toEqual(['g1'])
      expect(result.moves).toEqual([{ id: 'g0', pageNumber: 1, slotIndex: 3 }])
    })
  })

  it('與 planSlotInsertion 互為反向：插入後再移除同一格回到原座標', () => {
    const slots = [slot(1, 0), slot(1, 1), slot(1, 2), slot(1, 3)]
    const inserted = plan(planSlotInsertion, { slots, insertAt: { pageNumber: 1, slotIndex: 1 } })
    if (inserted.status !== 'planned') throw new Error(inserted.status)

    // 套用插入結果
    const moved = new Map(inserted.moves.map((m) => [m.id, m]))
    const afterInsert = slots.map((s) => ({ ...s, ...(moved.get(s.id) ?? {}) }))

    const removed = plan(planSlotRemoval, {
      slots: afterInsert,
      insertAt: { pageNumber: 1, slotIndex: 1 },
    })
    if (removed.status !== 'planned') throw new Error(removed.status)

    const back = new Map(removed.moves.map((m) => [m.id, m]))
    const final = afterInsert
      .map((s) => ({ ...s, ...(back.get(s.id) ?? {}) }))
      .sort((a, b) => a.id.localeCompare(b.id))

    expect(final.map((s) => ({ id: s.id, pageNumber: s.pageNumber, slotIndex: s.slotIndex }))).toEqual(
      [...slots]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((s) => ({ id: s.id, pageNumber: s.pageNumber, slotIndex: s.slotIndex })),
    )
  })
})
