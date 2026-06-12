import { describe, it, expect } from 'vitest'
import { GridType } from '@prisma/client'
import { buildGridPages, buildSpreads, buildMobilePages } from '../binder-utils'
import type { SlotWithCard } from '@/types/binder'
import type { GridPage } from '../binder-utils'

function makeSlot(overrides: Partial<SlotWithCard> & { pageNumber: number; slotIndex: number }): SlotWithCard {
  return {
    id: `slot-${overrides.pageNumber}-${overrides.slotIndex}`,
    binderId: 'b1',
    cardId: 'c1',
    status: 'owned',
    card: { id: 'c1', name: 'Pikachu', imageSmall: '', language: 'EN', cardNumber: '001', rarity: null },
    ...overrides,
  }
}

describe('buildGridPages', () => {
  it('grid_3x3 每頁產生 9 格', () => {
    const pages = buildGridPages([], 'grid_3x3' as GridType)
    expect(pages.get(1)).toHaveLength(9)
  })

  it('grid_4x4 每頁產生 16 格', () => {
    const pages = buildGridPages([], 'grid_4x4' as GridType)
    expect(pages.get(1)).toHaveLength(16)
  })

  it('空 slots 回傳第 1 頁全為 EmptySlot', () => {
    const pages = buildGridPages([], 'grid_2x2' as GridType)
    const page1 = pages.get(1)!
    expect(page1).toHaveLength(4)
    expect(page1.every((s) => s.id === null)).toBe(true)
  })

  it('空缺的 slotIndex 補上 EmptySlot', () => {
    const slots = [makeSlot({ pageNumber: 1, slotIndex: 0 }), makeSlot({ pageNumber: 1, slotIndex: 2 })]
    const pages = buildGridPages(slots, 'grid_3x3' as GridType)
    const page1 = pages.get(1)!
    expect(page1[0].id).not.toBeNull()
    expect(page1[1].id).toBeNull()
    expect(page1[2].id).not.toBeNull()
  })

  it('多頁資料正確分組', () => {
    const slots = [
      makeSlot({ pageNumber: 1, slotIndex: 0 }),
      makeSlot({ id: 'slot-2-1', pageNumber: 2, slotIndex: 1 }),
    ]
    const pages = buildGridPages(slots, 'grid_3x3' as GridType)
    expect(pages.size).toBe(2)
    expect(pages.get(1)![0].id).not.toBeNull()
    expect(pages.get(2)![1].id).not.toBeNull()
    expect(pages.get(2)![0].id).toBeNull()
  })
})

const emptyPage: GridPage = []

describe('buildSpreads', () => {
  it('Spread 0 的 left 為 cover，right 為 Page 1', () => {
    const page1: GridPage = [makeSlot({ pageNumber: 1, slotIndex: 0 })]
    const spreads = buildSpreads([page1])
    expect(spreads[0].left).toEqual({ type: 'cover' })
    expect(spreads[0].right).toMatchObject({ type: 'page', pageNumber: 1 })
  })

  it('Spread N (N>=1) 的 left/right 對應 Page 2N-1 / Page 2N', () => {
    const pages: GridPage[] = [emptyPage, emptyPage, emptyPage, emptyPage]
    const spreads = buildSpreads(pages)
    // Spread 1: left = page 2 (index 1), right = page 3 (index 2)
    expect(spreads[1].left).toMatchObject({ type: 'page', pageNumber: 2 })
    expect(spreads[1].right).toMatchObject({ type: 'page', pageNumber: 3 })
    // Spread 2: left = page 4 (index 3), right = blank (no page 5)
    expect(spreads[2].left).toMatchObject({ type: 'page', pageNumber: 4 })
    expect(spreads[2].right).toEqual({ type: 'blank' })
  })

  it('pages 長度為偶數時，最後 Spread 的 right 為 blank', () => {
    // cover takes slot 0; then pairs: (page2,page3), (page4,blank)
    // With 4 pages: spread 0=cover+p1, spread 1=p2+p3, spread 2=p4+blank
    const pages: GridPage[] = [emptyPage, emptyPage, emptyPage, emptyPage] // 4 pages
    const spreads = buildSpreads(pages)
    const last = spreads[spreads.length - 1]
    expect(last.right).toEqual({ type: 'blank' })
  })

  it('pages 為空陣列時，仍回傳含 Spread 0（cover + blank）', () => {
    const spreads = buildSpreads([])
    expect(spreads).toHaveLength(1)
    expect(spreads[0].left).toEqual({ type: 'cover' })
    expect(spreads[0].right).toEqual({ type: 'blank' })
  })
})

describe('buildMobilePages', () => {
  it('回傳順序為 [cover, Page1, Page2, ...]', () => {
    const pages: GridPage[] = [emptyPage, emptyPage]
    const result = buildMobilePages(pages)
    expect(result[0]).toEqual({ type: 'cover' })
    expect(result[1]).toMatchObject({ type: 'page', pageNumber: 1 })
    expect(result[2]).toMatchObject({ type: 'page', pageNumber: 2 })
  })

  it('pages 為空陣列時，回傳僅含 cover', () => {
    const result = buildMobilePages([])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'cover' })
  })
})
