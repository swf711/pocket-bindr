import { describe, it, expect } from 'vitest'
import { planSlotPlacement } from '../binder-slot-placement'
import { MAX_PAGES_PER_BINDER } from '../binder-limits'

describe('planSlotPlacement', () => {
  it('優先填空格、不足才算新頁碼', () => {
    const result = planSlotPlacement({
      emptySlotIds: ['slot1'],
      lastSlot: { pageNumber: 1, slotIndex: 2 },
      slotsPerPage: 9,
      needed: 3,
    })
    expect(result.fillSlotIds).toEqual(['slot1'])
    expect(result.newPositions).toEqual([
      { pageNumber: 1, slotIndex: 3 },
      { pageNumber: 1, slotIndex: 4 },
    ])
    expect(result.exceedsLimit).toBe(false)
  })

  it('新頁碼跨頁正確進位', () => {
    const result = planSlotPlacement({
      emptySlotIds: [],
      lastSlot: { pageNumber: 1, slotIndex: 8 }, // 3x3 grid last slot on page 1
      slotsPerPage: 9,
      needed: 2,
    })
    expect(result.newPositions).toEqual([
      { pageNumber: 2, slotIndex: 0 },
      { pageNumber: 2, slotIndex: 1 },
    ])
  })

  it('無既有格位（lastSlot=null）從頁 1 格 0 開始', () => {
    const result = planSlotPlacement({
      emptySlotIds: [],
      lastSlot: null,
      slotsPerPage: 9,
      needed: 2,
    })
    expect(result.newPositions).toEqual([
      { pageNumber: 1, slotIndex: 0 },
      { pageNumber: 1, slotIndex: 1 },
    ])
  })

  it('超過 MAX_PAGES_PER_BINDER → exceedsLimit=true 且不產生 newPositions', () => {
    const slotsPerPage = 9
    const lastAbsoluteIndex = MAX_PAGES_PER_BINDER * slotsPerPage - 1 // 最後一格已滿
    const lastPageNumber = Math.floor(lastAbsoluteIndex / slotsPerPage) + 1
    const lastSlotIndex = lastAbsoluteIndex % slotsPerPage
    const result = planSlotPlacement({
      emptySlotIds: [],
      lastSlot: { pageNumber: lastPageNumber, slotIndex: lastSlotIndex },
      slotsPerPage,
      needed: 1,
    })
    expect(result.exceedsLimit).toBe(true)
    expect(result.newPositions).toEqual([])
    expect(result.remainingCapacity).toBe(0)
  })

  it('remainingCapacity 計算正確（有 lastSlot）', () => {
    const result = planSlotPlacement({
      emptySlotIds: ['slot1', 'slot2'],
      lastSlot: { pageNumber: 1, slotIndex: 2 },
      slotsPerPage: 9,
      needed: 1,
    })
    // remaining new-slot capacity huge; plus 2 existing empty slots
    expect(result.remainingCapacity).toBeGreaterThan(800)
  })

  it('remainingCapacity 計算正確（無 lastSlot，滿容量）', () => {
    const slotsPerPage = 9
    const result = planSlotPlacement({
      emptySlotIds: [],
      lastSlot: null,
      slotsPerPage,
      needed: 1,
    })
    expect(result.remainingCapacity).toBe(MAX_PAGES_PER_BINDER * slotsPerPage)
  })

  it('剛好卡在上限邊界時允許填滿最後一格', () => {
    const slotsPerPage = 9
    const lastAbsoluteIndex = MAX_PAGES_PER_BINDER * slotsPerPage - 2 // 倒數第二格已佔用
    const lastPageNumber = Math.floor(lastAbsoluteIndex / slotsPerPage) + 1
    const lastSlotIndex = lastAbsoluteIndex % slotsPerPage
    const result = planSlotPlacement({
      emptySlotIds: [],
      lastSlot: { pageNumber: lastPageNumber, slotIndex: lastSlotIndex },
      slotsPerPage,
      needed: 1,
    })
    expect(result.exceedsLimit).toBe(false)
    expect(result.newPositions).toHaveLength(1)
  })
})
