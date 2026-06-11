import { describe, it, expect } from 'vitest'
import { GridType } from '@prisma/client'
import { buildGridPages } from '../binder-utils'
import type { SlotWithCard } from '@/types/binder'

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
