import { describe, it, expect } from 'vitest'
import {
  groupSlotIndices,
  planGroupPlacement,
  slotKey,
} from '../binder-slot-placement'
import { repackSlotsForGridChange, type RepackSlot } from '../binder-utils'
import { MAX_PAGES_PER_BINDER } from '../binder-limits'

const occupy = (...cells: [number, number][]) => new Set(cells.map(([p, i]) => slotKey(p, i)))

describe('groupSlotIndices', () => {
  it('3×3 格線的 2×2 群組從左上起算 → {0,1,3,4}', () => {
    expect(groupSlotIndices(0, 2, 2, 3)).toEqual([0, 1, 3, 4])
  })

  it('左右兩格群組只佔同一列相鄰兩格', () => {
    expect(groupSlotIndices(4, 2, 1, 3)).toEqual([4, 5])
  })

  it('4 欄格線的 2×2 群組跨列位移為 4', () => {
    expect(groupSlotIndices(1, 2, 2, 4)).toEqual([1, 2, 5, 6])
  })
})

describe('planGroupPlacement', () => {
  const base = { gridCols: 3, slotsPerPage: 9, totalPages: 1, cols: 2, rows: 2 }

  it('空卡冊 → 放在第 1 頁左上', () => {
    const res = planGroupPlacement({ ...base, occupied: new Set() })
    expect(res).toEqual({ status: 'placed', pageNumber: 1, slotIndices: [0, 1, 3, 4], newPage: false })
  })

  it('左上被佔 → 往右找到下一個可用矩形', () => {
    const res = planGroupPlacement({ ...base, occupied: occupy([1, 0]) })
    expect(res).toMatchObject({ status: 'placed', pageNumber: 1, slotIndices: [1, 2, 4, 5] })
  })

  it('同頁湊不出矩形 → 跳到下一頁而非硬塞', () => {
    // 第 1 頁只留下不相鄰的空格
    const res = planGroupPlacement({
      ...base,
      totalPages: 2,
      occupied: occupy([1, 0], [1, 2], [1, 4], [1, 6], [1, 8]),
    })
    expect(res).toMatchObject({ status: 'placed', pageNumber: 2, slotIndices: [0, 1, 3, 4], newPage: false })
  })

  it('既有頁全無空矩形 → 自動開新頁', () => {
    const full = new Set(Array.from({ length: 9 }, (_, i) => slotKey(1, i)))
    const res = planGroupPlacement({ ...base, occupied: full })
    expect(res).toMatchObject({ status: 'placed', pageNumber: 2, newPage: true })
  })

  it('grid_1x2（1 欄）容不下任何跨格形狀 → unsupported，呼叫端退回單格', () => {
    expect(
      planGroupPlacement({ occupied: new Set(), gridCols: 1, slotsPerPage: 2, totalPages: 1, cols: 2, rows: 1 }),
    ).toEqual({ status: 'unsupported' })
  })

  it('grid_2x2 放 2×2 群組會佔滿整頁，但仍是合法放置', () => {
    const res = planGroupPlacement({
      occupied: new Set(),
      gridCols: 2,
      slotsPerPage: 4,
      totalPages: 1,
      cols: 2,
      rows: 2,
    })
    expect(res).toMatchObject({ status: 'placed', slotIndices: [0, 1, 2, 3] })
  })

  it('需要新頁但已達頁數上限 → 整組拒絕', () => {
    const full = new Set<string>()
    for (let p = 1; p <= MAX_PAGES_PER_BINDER; p++) {
      for (let i = 0; i < 9; i++) full.add(slotKey(p, i))
    }
    expect(
      planGroupPlacement({ ...base, totalPages: MAX_PAGES_PER_BINDER, occupied: full }),
    ).toEqual({ status: 'pageLimit' })
  })
})

describe('repackSlotsForGridChange', () => {
  /** 3×3 頁面上的一組 2×2（index 0,1,3,4） */
  const group2x2 = (page = 1, base = 0, gridCols = 3): RepackSlot[] =>
    groupSlotIndices(base, 2, 2, gridCols).map((slotIndex, i) => ({
      id: `g${i}`,
      pageNumber: page,
      slotIndex,
      groupId: 'G',
      groupIndex: i,
    }))

  const groups = [{ id: 'G', cols: 2, rows: 2 }]

  it('欄數不變（4×3 → 4×4）時群組原地保留', () => {
    const slots = group2x2(1, 0, 4)
    const res = repackSlotsForGridChange({
      slots,
      groups,
      newGridCols: 4,
      newSlotsPerPage: 16,
      currentTotalPages: 1,
    })
    expect(res.moves).toEqual([])
    expect(res.dissolvedGroupIds).toEqual([])
  })

  it('3×3 → 4×4 欄數改變會打散矩形，群組整組搬到新的合法矩形', () => {
    const slots = group2x2(1, 0, 3) // index 0,1,3,4
    const res = repackSlotsForGridChange({
      slots,
      groups,
      newGridCols: 4,
      newSlotsPerPage: 16,
      currentTotalPages: 1,
    })
    expect(res.dissolvedGroupIds).toEqual([])
    // moves 只含位置真的改變的格位；最終位置＝原位套用 moves
    const finalIndices = slots
      .map((s) => res.moves.find((m) => m.id === s.id)?.slotIndex ?? s.slotIndex)
      .sort((a, b) => a - b)
    // 4 欄格線的左上 2×2 = {0,1,4,5}
    expect(finalIndices).toEqual([0, 1, 4, 5])
    expect(res.moves.every((m) => m.pageNumber === 1)).toBe(true)
  })

  it('新格線容不下（→ grid_1x2）時拆回單格，只留 anchor', () => {
    const slots = group2x2(1, 0, 3)
    const res = repackSlotsForGridChange({
      slots,
      groups,
      newGridCols: 1,
      newSlotsPerPage: 2,
      currentTotalPages: 1,
    })
    expect(res.dissolvedGroupIds).toEqual(['G'])
    // 只留 anchor（g0，原位 index 0 在界內）；其餘成員刪除，不留成獨立格位
    expect(res.removedSlotIds.sort()).toEqual(['g1', 'g2', 'g3'])
    expect(res.moves).toEqual([])
    expect(res.totalPages).toBe(1)
  })

  it('一般格位在界內時完全不動（最小擾動）', () => {
    const slots: RepackSlot[] = [
      { id: 's1', pageNumber: 1, slotIndex: 0, groupId: null, groupIndex: null },
      { id: 's2', pageNumber: 1, slotIndex: 8, groupId: null, groupIndex: null },
    ]
    const res = repackSlotsForGridChange({
      slots,
      groups: [],
      newGridCols: 4,
      newSlotsPerPage: 16,
      currentTotalPages: 1,
    })
    expect(res.moves).toEqual([])
    expect(res.totalPages).toBe(1)
  })

  it('溢位的一般格位沿用既有語意排到既有頁數之後', () => {
    const slots: RepackSlot[] = [
      { id: 's1', pageNumber: 1, slotIndex: 0, groupId: null, groupIndex: null },
      { id: 's2', pageNumber: 1, slotIndex: 8, groupId: null, groupIndex: null },
    ]
    const res = repackSlotsForGridChange({
      slots,
      groups: [],
      newGridCols: 2,
      newSlotsPerPage: 4,
      currentTotalPages: 1,
    })
    expect(res.moves).toEqual([{ id: 's2', pageNumber: 2, slotIndex: 0 }])
    expect(res.totalPages).toBe(2)
  })

  it('群組搬移不會覆蓋原地不動的一般格位', () => {
    const slots: RepackSlot[] = [
      ...group2x2(1, 0, 3),
      { id: 's1', pageNumber: 1, slotIndex: 0, groupId: null, groupIndex: null },
    ]
    const res = repackSlotsForGridChange({
      slots,
      groups,
      newGridCols: 4,
      newSlotsPerPage: 16,
      currentTotalPages: 1,
    })
    // s1 佔住 index 0，群組必須改放別處
    expect(res.moves.find((m) => m.id === 's1')).toBeUndefined()
    const groupIndices = res.moves.filter((m) => m.id.startsWith('g')).map((m) => m.slotIndex)
    expect(groupIndices).not.toContain(0)
    expect(new Set(groupIndices).size).toBe(4)
  })
})
