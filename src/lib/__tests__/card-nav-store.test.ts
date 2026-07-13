import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  publishCardNavList,
  getCardNavNeighbors,
  subscribeCardNavList,
  getCardNavListSnapshot,
} from '../card-nav-store'
import { CardWithCollectionStatus } from '@/types/card'

function makeCard(externalId: string): CardWithCollectionStatus {
  return {
    id: `id-${externalId}`,
    externalId,
    game: 'PTCG',
    language: 'EN',
    name: `Card ${externalId}`,
    imageSmall: '',
    imageLarge: '',
    supertype: 'Pokémon',
    rarity: null,
    hp: null,
    types: [],
    cardNumber: '001',
    isCollectible: true,
    canonicalCardId: null,
    attributes: null,
    collectionStatus: { owned: null, wanted: null },
    set: { id: 'set1', name: 'Test Set', series: 'S', externalId: 'SV1', releaseDate: null },
  }
}

describe('card-nav-store', () => {
  beforeEach(() => {
    publishCardNavList([])
  })

  it('store 為空回 null', () => {
    expect(getCardNavNeighbors('PTCG', 'EN', 'sv3-25')).toBeNull()
  })

  it('publish 後 getNeighbors 回正確 index/total', () => {
    const cards = [makeCard('a'), makeCard('b'), makeCard('c')]
    publishCardNavList(cards)
    const result = getCardNavNeighbors('PTCG', 'EN', 'b')
    expect(result).not.toBeNull()
    expect(result!.index).toBe(1)
    expect(result!.total).toBe(3)
    expect(result!.cards).toBe(cards)
  })

  it('目標卡不在當頁列表回 null', () => {
    publishCardNavList([makeCard('a')])
    expect(getCardNavNeighbors('PTCG', 'EN', 'not-here')).toBeNull()
  })

  it('game/language 不符不誤中', () => {
    publishCardNavList([makeCard('a')])
    expect(getCardNavNeighbors('OPCG', 'EN', 'a')).toBeNull()
  })

  it('getCardNavListSnapshot 回傳當前 store 內容', () => {
    const cards = [makeCard('a')]
    publishCardNavList(cards)
    expect(getCardNavListSnapshot()).toBe(cards)
  })

  it('subscribeCardNavList 訂閱者於 publish 時被通知（加入卡冊後重抓更新 modal 的關鍵機制）', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeCardNavList(listener)
    publishCardNavList([makeCard('a')])
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    publishCardNavList([makeCard('b')])
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
