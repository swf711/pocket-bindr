import { describe, it, expect } from 'vitest'
import { rarityRank, cardNumberNumerator, compareShowcaseCards, HIGH_RARITIES } from '@/lib/homepage-rarity'
import type { ShowcaseCard } from '@/types/homepage'

function makeCard(overrides: Partial<ShowcaseCard>): ShowcaseCard {
  return {
    id: 'card-1',
    name: 'Test Card',
    imageSmall: '/img.png',
    imageLarge: '/img-large.png',
    supertype: 'Pokémon',
    rarity: null,
    hp: null,
    types: [],
    cardNumber: '001',
    isCollectible: true,
    canonicalCardId: null,
    attributes: null,
    collectionStatus: { owned: 0, wanted: 0 },
    set: { id: 'set-1', name: 'Set', series: 'Series', externalId: 'set-1', releaseDate: null },
    ...overrides,
  }
}

describe('rarityRank', () => {
  it('OPCG：SEC > SR > R', () => {
    expect(rarityRank('OPCG', 'SEC')).toBeGreaterThan(rarityRank('OPCG', 'SR'))
    expect(rarityRank('OPCG', 'SR')).toBeGreaterThan(rarityRank('OPCG', 'R'))
  })

  it('PTCG EN：Special Illustration Rare > Rare', () => {
    expect(rarityRank('PTCG', 'Special Illustration Rare')).toBeGreaterThan(
      rarityRank('PTCG', 'Rare')
    )
  })

  it('PTCG JA：sar > c_c', () => {
    expect(rarityRank('PTCG', 'sar')).toBeGreaterThan(rarityRank('PTCG', 'c_c'))
  })

  it('未知或空字串回傳 -1', () => {
    expect(rarityRank('PTCG', null)).toBe(-1)
    expect(rarityRank('PTCG', '')).toBe(-1)
    expect(rarityRank('OPCG', 'unknown-rarity')).toBe(-1)
  })

  it('大小寫與前後空白不影響比對', () => {
    expect(rarityRank('OPCG', ' sec ')).toBe(rarityRank('OPCG', 'SEC'))
  })
})

describe('cardNumberNumerator', () => {
  it('取斜線卡號的分子', () => {
    expect(cardNumberNumerator('766/742')).toBe(766)
  })

  it('無斜線純數字卡號', () => {
    expect(cardNumberNumerator('119')).toBe(119)
  })

  it('前導零不影響數值', () => {
    expect(cardNumberNumerator('081/081')).toBe(81)
  })

  it('無法解析數字時回傳 -1', () => {
    expect(cardNumberNumerator('LIG')).toBe(-1)
  })
})

describe('compareShowcaseCards', () => {
  it('稀有度較高的卡排在前面', () => {
    const low = makeCard({ id: 'low', rarity: 'C' })
    const high = makeCard({ id: 'high', rarity: 'SEC' })

    const sorted = [low, high].sort(compareShowcaseCards('OPCG'))

    expect(sorted[0].id).toBe('high')
  })

  it('PTCG ZH_TW 全空 rarity 時退化成卡號遞減（secret ex 浮到最前）', () => {
    const energy = makeCard({ id: 'energy', rarity: null, cardNumber: '081/081' })
    const secretEx = makeCard({ id: 'secret-ex', rarity: null, cardNumber: '766/742' })

    const sorted = [energy, secretEx].sort(compareShowcaseCards('PTCG'))

    expect(sorted[0].id).toBe('secret-ex')
  })

  it('稀有度相同時以卡號遞減排序', () => {
    const a = makeCard({ id: 'a', rarity: 'R', cardNumber: '050' })
    const b = makeCard({ id: 'b', rarity: 'R', cardNumber: '100' })

    const sorted = [a, b].sort(compareShowcaseCards('OPCG'))

    expect(sorted[0].id).toBe('b')
  })
})

describe('HIGH_RARITIES', () => {
  it('每個 game 的高階清單皆非空，且不含最低階稀有度', () => {
    expect(HIGH_RARITIES.OPCG.length).toBeGreaterThan(0)
    expect(HIGH_RARITIES.OPCG).not.toContain('c')
    expect(HIGH_RARITIES.PTCG.length).toBeGreaterThan(0)
    expect(HIGH_RARITIES.PTCG).not.toContain('common')
  })
})
