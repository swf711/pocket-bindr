import { describe, it, expect } from 'vitest'
import { toDisplaySlot } from '../slot-display'

const jaCard = { id: 'ja-1', name: 'ルフィ', imageSmall: 'ja.png', language: 'JA' as const, cardNumber: 'OP01-001', rarity: null }
const zhCard = { id: 'zh-1', name: '魯夫', imageSmall: 'zh.png', language: 'ZH_TW' as const, cardNumber: 'OP01-001', rarity: null }

function makeRawSlot(over: Partial<Parameters<typeof toDisplaySlot>[0]> = {}) {
  return {
    id: 'slot-1',
    binderId: 'b-1',
    cardId: 'ja-1',
    displayCardId: null,
    pageNumber: 1,
    slotIndex: 0,
    status: 'owned' as const,
    card: jaCard,
    displayCard: null,
    ...over,
  }
}

describe('toDisplaySlot', () => {
  it('無 displayCard 時以 canonical card 呈現（cardId = canonical）', () => {
    const slot = toDisplaySlot(makeRawSlot())
    expect(slot.card.language).toBe('JA')
    expect(slot.cardId).toBe('ja-1')
    expect(slot.card.id).toBe('ja-1')
  })

  it('有 displayCard（OPCG ZH_TW alias）時以顯示卡呈現（cardId = 顯示卡 id）', () => {
    const slot = toDisplaySlot(makeRawSlot({ displayCardId: 'zh-1', displayCard: zhCard }))
    expect(slot.card.language).toBe('ZH_TW')
    expect(slot.card.name).toBe('魯夫')
    // canonical id 不外露，cardId 與 card.id 一致為顯示卡 id
    expect(slot.cardId).toBe('zh-1')
    expect(slot.card.id).toBe('zh-1')
  })

  it('有 displayCard 時 imageSmall 固定取 canonical（OPCG ZH_TW alias 無實體印刷圖，圖片指向 JA）', () => {
    const slot = toDisplaySlot(makeRawSlot({ displayCardId: 'zh-1', displayCard: zhCard }))
    expect(slot.card.imageSmall).toBe('ja.png')
  })
})
