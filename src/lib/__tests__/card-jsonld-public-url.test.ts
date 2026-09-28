import { describe, it, expect, vi, afterEach } from 'vitest'
import type { PublicCardRow } from '../public-card'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

const labels = { home: '首頁', cards: '卡牌搜尋' }

function baseCard(): PublicCardRow {
  return {
    id: 'card-1',
    externalId: 'sv3-25',
    language: 'EN',
    game: 'PTCG',
    name: 'Pikachu',
    supertype: 'Pokémon',
    subtypes: [],
    hp: 60,
    types: ['Lightning'],
    setId: 'set-1',
    cardNumber: '025',
    rarity: 'Common',
    imageSmall: 'https://images.pokemontcg.io/sv3/25.png',
    imageLarge: 'https://images.pokemontcg.io/sv3/25_hires.png',
    syncedAt: new Date('2026-01-01'),
    attributes: null,
    isCollectible: true,
    canonicalCardId: null,
    canonicalCard: null,
    set: {
      id: 'set-1',
      name: 'Obsidian Flames',
      series: 'Scarlet & Violet',
      totalCards: 230,
      releaseDate: new Date('2023-08-11'),
      symbolUrl: null,
      game: 'PTCG',
      language: 'EN',
      externalId: 'sv3',
      syncedAt: new Date('2026-01-01'),
    },
  } as PublicCardRow
}

describe('buildCardJsonLd selfUrl（總開關已設）', () => {
  it('mainEntity/webPage 的 url 指向子網域；麵包屑仍指向主站 SITE_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', 'https://cards.pocketbindr.app')
    vi.stubEnv('AUTH_URL', 'https://pocketbindr.app')
    const { buildCardBreadcrumbItems, buildCardJsonLd } = await import('../card-jsonld')

    const card = baseCard()
    const breadcrumbItems = buildCardBreadcrumbItems(card, labels)
    const jsonLd = buildCardJsonLd(card, breadcrumbItems) as { '@graph': Record<string, unknown>[] }
    const [breadcrumbList, webPage] = jsonLd['@graph'] as [
      { itemListElement: { item?: string }[] },
      { url: string; mainEntity: { url: string } },
    ]

    expect(webPage.url).toBe('https://cards.pocketbindr.app/ptcg/en/sv3-25')
    expect(webPage.mainEntity.url).toBe('https://cards.pocketbindr.app/ptcg/en/sv3-25')

    // 麵包屑（首頁／卡牌／系列）不受子網域開關影響，仍指向主站。
    for (const item of breadcrumbList.itemListElement) {
      if (item.item) expect(item.item.startsWith('https://pocketbindr.app')).toBe(true)
    }
  })
})
