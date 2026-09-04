import { describe, it, expect } from 'vitest'
import { planSlotInsertion, type InsertionSlot } from '../binder-slot-placement'
import { MAX_PAGES_PER_BINDER } from '../binder-limits'

const GRID_COLS = 3
const SLOTS_PER_PAGE = 9

/** 便利建構：以 (page, index) 產生單格 row，id 為 `p{page}s{index}` */
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

/** 填滿指定頁的所有格位 */
function fullPage(pageNumber: number): InsertionSlot[] {
  return Array.from({ length: SLOTS_PER_PAGE }, (_, i) => slot(pageNumber, i))
}

function plan(input: Partial<Parameters<typeof planSlotInsertion>[0]> & { slots: InsertionSlot[]; insertAt: { pageNumber: number; slotIndex: number } }) {
  return planSlotInsertion({
    groups: [],
    gridCols: GRID_COLS,
    slotsPerPage: SLOTS_PER_PAGE,
    totalPages: 1,
    ...input,
  })
}

describe('planSlotInsertion', () => {
  it('插入點本身是空格 → noop', () => {
    const result = plan({ slots: [slot(1, 0)], insertAt: { pageNumber: 1, slotIndex: 3 } })
    expect(result.status).toBe('noop')
  })

  it('插入點後連續 3 張卡、第 4 格為空 → 3 張各推一格，其後不動', () => {
    const slots = [slot(1, 0), slot(1, 1), slot(1, 2), slot(1, 3), slot(1, 5)]
    const result = plan({ slots, insertAt: { pageNumber: 1, slotIndex: 1 } })
    if (result.status !== 'planned') throw new Error(result.status)

    expect(result.moves).toEqual([
      { id: 'p1s1', pageNumber: 1, slotIndex: 2 },
      { id: 'p1s2', pageNumber: 1, slotIndex: 3 },
      { id: 'p1s3', pageNumber: 1, slotIndex: 4 },
    ])
    // index 5 的卡在第一個空位（index 4）之後，不受影響
    expect(result.moves.some((m) => m.id === 'p1s5')).toBe(false)
    expect(result.newTotalPages).toBe(1)
  })

  it('位移跨頁串接：頁尾滿時最後一張推到下一頁第 0 格', () => {
    const slots = [...fullPage(1), slot(2, 1)]
    const result = plan({ slots, totalPages: 2, insertAt: { pageNumber: 1, slotIndex: 8 } })
    if (result.status !== 'planned') throw new Error(result.status)

    expect(result.moves).toEqual([{ id: 'p1s8', pageNumber: 2, slotIndex: 0 }])
    expect(result.newTotalPages).toBe(2)
  })

  it('全卡冊已滿 → 自動增一頁', () => {
    const slots = [...fullPage(1), ...fullPage(2)]
    const result = plan({ slots, totalPages: 2, insertAt: { pageNumber: 2, slotIndex: 7 } })
    if (result.status !== 'planned') throw new Error(result.status)

    expect(result.moves).toEqual([
      { id: 'p2s7', pageNumber: 2, slotIndex: 8 },
      { id: 'p2s8', pageNumber: 3, slotIndex: 0 },
    ])
    expect(result.newTotalPages).toBe(3)
  })

  it('已達頁數上限且全滿 → pageLimit', () => {
    const slots = [
      slot(MAX_PAGES_PER_BINDER, SLOTS_PER_PAGE - 2),
      slot(MAX_PAGES_PER_BINDER, SLOTS_PER_PAGE - 1),
    ]
    const result = plan({
      slots,
      totalPages: MAX_PAGES_PER_BINDER,
      insertAt: { pageNumber: MAX_PAGES_PER_BINDER, slotIndex: SLOTS_PER_PAGE - 2 },
    })
    expect(result.status).toBe('pageLimit')
  })

  describe('跨格群組', () => {
    // 2×1 群組佔 page1 的 index 3、4
    const groupSlots: InsertionSlot[] = [
      { id: 'g0', pageNumber: 1, slotIndex: 3, groupId: 'grp', groupIndex: 0 },
      { id: 'g1', pageNumber: 1, slotIndex: 4, groupId: 'grp', groupIndex: 1 },
    ]
    const groups = [{ id: 'grp', cols: 2, rows: 1 }]

    it('範圍內有群組且未帶 groupMode → blockedByGroup', () => {
      const result = plan({
        slots: [slot(1, 0), slot(1, 1), slot(1, 2), ...groupSlots],
        groups,
        insertAt: { pageNumber: 1, slotIndex: 1 },
      })
      expect(result).toEqual({ status: 'blockedByGroup', groupIds: ['grp'] })
    })

    it('shift：群組整組位移', () => {
      const result = plan({
        slots: [slot(1, 2), ...groupSlots],
        groups,
        groupMode: 'shift',
        insertAt: { pageNumber: 1, slotIndex: 2 },
      })
      if (result.status !== 'planned') throw new Error(result.status)

      expect(result.moves).toEqual([
        { id: 'p1s2', pageNumber: 1, slotIndex: 3 },
        { id: 'g0', pageNumber: 1, slotIndex: 4 },
        { id: 'g1', pageNumber: 1, slotIndex: 5 },
      ])
      expect(result.collapsedGroupIds).toEqual([])
    })

    it('shift：群組壓到列尾時往後找到下一列的合法矩形', () => {
      // 群組佔 index 4、5（第 2 列尾）；+1 會讓它跨列，必須整組落到下一列開頭
      const rowEndGroup: InsertionSlot[] = [
        { id: 'g0', pageNumber: 1, slotIndex: 4, groupId: 'grp', groupIndex: 0 },
        { id: 'g1', pageNumber: 1, slotIndex: 5, groupId: 'grp', groupIndex: 1 },
      ]
      const result = plan({
        slots: [slot(1, 3), ...rowEndGroup],
        groups,
        groupMode: 'shift',
        insertAt: { pageNumber: 1, slotIndex: 3 },
      })
      if (result.status !== 'planned') throw new Error(result.status)

      expect(result.moves).toEqual([
        { id: 'p1s3', pageNumber: 1, slotIndex: 4 },
        { id: 'g0', pageNumber: 1, slotIndex: 6 },
        { id: 'g1', pageNumber: 1, slotIndex: 7 },
      ])
    })

    it('collapse：群組只留 anchor，其餘成員進 removedSlotIds', () => {
      const result = plan({
        slots: [slot(1, 2), ...groupSlots],
        groups,
        groupMode: 'collapse',
        insertAt: { pageNumber: 1, slotIndex: 2 },
      })
      if (result.status !== 'planned') throw new Error(result.status)

      expect(result.collapsedGroupIds).toEqual(['grp'])
      expect(result.removedSlotIds).toEqual(['g1'])
      expect(result.moves).toEqual([
        { id: 'p1s2', pageNumber: 1, slotIndex: 3 },
        { id: 'g0', pageNumber: 1, slotIndex: 4 },
      ])
    })

    it('插入點落在群組矩形中間 → 該群組整組算進位移範圍', () => {
      const result = plan({
        slots: groupSlots,
        groups,
        insertAt: { pageNumber: 1, slotIndex: 4 },
      })
      expect(result).toEqual({ status: 'blockedByGroup', groupIds: ['grp'] })
    })
  })

  it('moves 只含位置真的改變的格位', () => {
    const slots = [slot(1, 0), slot(1, 1), slot(1, 4)]
    const result = plan({ slots, insertAt: { pageNumber: 1, slotIndex: 0 } })
    if (result.status !== 'planned') throw new Error(result.status)

    expect(result.moves.map((m) => m.id)).toEqual(['p1s0', 'p1s1'])
  })
})
