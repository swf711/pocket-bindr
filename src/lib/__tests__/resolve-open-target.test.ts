import { describe, it, expect } from 'vitest'
import { resolveOpenTarget } from '../resolve-open-target'
import type { CardWithCollectionStatus } from '@/types/card'

function card(externalId: string): CardWithCollectionStatus {
  return {
    id: `id-${externalId}`,
    externalId,
    game: 'PTCG',
    language: 'EN',
    name: 'Pikachu',
    imageSmall: '',
    imageLarge: '',
    supertype: 'Pokémon',
    rarity: null,
    hp: null,
    types: [],
    cardNumber: '025',
    isCollectible: true,
    canonicalCardId: null,
    attributes: null,
  } as unknown as CardWithCollectionStatus
}

describe('resolveOpenTarget', () => {
  it('isPlaceholder 時不回傳目標，即使 cards 內含該卡', () => {
    expect(resolveOpenTarget([card('sv3-25')], 'sv3-25', true)).toBeNull()
  })

  it('結果含該卡才回傳目標；不含回 null', () => {
    expect(resolveOpenTarget([card('sv3-25')], 'sv3-25', false)).toBe('/cards/ptcg/en/sv3-25')
    expect(resolveOpenTarget([card('sv3-25')], 'sv3-99', false)).toBeNull()
  })

  it('open 為空時一律回 null', () => {
    expect(resolveOpenTarget([card('sv3-25')], undefined, false)).toBeNull()
    expect(resolveOpenTarget([card('sv3-25')], null, false)).toBeNull()
    expect(resolveOpenTarget([card('sv3-25')], '', false)).toBeNull()
  })

  it('大小寫不同的 externalId 仍可比對', () => {
    expect(resolveOpenTarget([card('OP01-001')], 'op01-001', false)).toBe('/cards/ptcg/en/OP01-001')
  })
})
