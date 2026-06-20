import { describe, it, expect } from 'vitest'
import { applySwap } from '../binder-cache-utils'
import type { BinderDetailResponse, SlotWithCard } from '@/types/binder'

function makeSlot(id: string, pageNumber: number, slotIndex: number): SlotWithCard {
  return {
    id,
    binderId: 'binder-1',
    cardId: `card-${id}`,
    pageNumber,
    slotIndex,
    status: 'owned',
    card: {
      id: `card-${id}`,
      name: 'Test Card',
      imageSmall: '',
      language: 'EN',
      cardNumber: '001',
      rarity: null,
    },
  }
}

function makeBinder(slots: SlotWithCard[]): BinderDetailResponse {
  return {
    id: 'binder-1',
    name: 'Test Binder',
    gridType: 'grid_3x3',
    coverColor: '#ffffff',
    description: null,
    settings: { totalPages: 1 },
    slots,
  }
}

describe('applySwap', () => {
  it('2 つのスロットの pageNumber/slotIndex を入れ替える', () => {
    const slotA = makeSlot('a', 1, 0)
    const slotB = makeSlot('b', 1, 1)
    const binder = makeBinder([slotA, slotB])

    const result = applySwap(binder, { slotAId: 'a', slotBId: 'b' })

    const newA = result!.slots.find((s) => s.id === 'a')!
    const newB = result!.slots.find((s) => s.id === 'b')!
    expect(newA.pageNumber).toBe(1)
    expect(newA.slotIndex).toBe(1)
    expect(newB.pageNumber).toBe(1)
    expect(newB.slotIndex).toBe(0)
  })

  it('見つからないスロット id の場合は old をそのまま返す', () => {
    const slotA = makeSlot('a', 1, 0)
    const binder = makeBinder([slotA])

    const result = applySwap(binder, { slotAId: 'a', slotBId: 'nonexistent' })
    expect(result).toBe(binder)
  })

  it('old が undefined の場合は undefined を返す', () => {
    const result = applySwap(undefined, { slotAId: 'a', slotBId: 'b' })
    expect(result).toBeUndefined()
  })

  it('同一スロット id を渡しても位置が変わらない', () => {
    const slotA = makeSlot('a', 1, 0)
    const binder = makeBinder([slotA])

    const result = applySwap(binder, { slotAId: 'a', slotBId: 'a' })
    const newA = result!.slots.find((s) => s.id === 'a')!
    expect(newA.pageNumber).toBe(1)
    expect(newA.slotIndex).toBe(0)
  })

  it('跨ページのスロット swap（pageNumber が異なる）', () => {
    const slotA = makeSlot('a', 1, 0)
    const slotB = makeSlot('b', 2, 3)
    const binder = makeBinder([slotA, slotB])

    const result = applySwap(binder, { slotAId: 'a', slotBId: 'b' })

    const newA = result!.slots.find((s) => s.id === 'a')!
    const newB = result!.slots.find((s) => s.id === 'b')!
    expect(newA.pageNumber).toBe(2)
    expect(newA.slotIndex).toBe(3)
    expect(newB.pageNumber).toBe(1)
    expect(newB.slotIndex).toBe(0)
  })
})
