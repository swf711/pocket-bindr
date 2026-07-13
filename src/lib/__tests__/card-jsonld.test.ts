import { describe, it, expect } from 'vitest'
import { buildCardBreadcrumbItems, buildCardJsonLd, CARD_JSONLD_LANG } from '../card-jsonld'
import type { PublicCardRow } from '../public-card'

const labels = { home: '首頁', cards: '卡牌搜尋' }

function baseCard(overrides: Partial<PublicCardRow> = {}): PublicCardRow {
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
    ...overrides,
  } as PublicCardRow
}

describe('buildCardBreadcrumbItems', () => {
  it('四層：首頁 / 卡牌 / 系列（帶 query）/ 卡名（末節無 href）', () => {
    const card = baseCard()
    const items = buildCardBreadcrumbItems(card, labels)
    expect(items).toEqual([
      { name: '首頁', href: '/' },
      { name: '卡牌搜尋', href: '/cards' },
      { name: 'Obsidian Flames', href: '/cards?game=PTCG&language=EN&setId=set-1' },
      { name: 'Pikachu', href: null },
    ])
  })

  it('系列節點不指向 /cards/{game} 或 /cards/{game}/{language}（該 URL 不存在，會 404）', () => {
    const items = buildCardBreadcrumbItems(baseCard(), labels)
    for (const item of items) {
      if (item.href) expect(item.href).not.toMatch(/^\/cards\/(ptcg|opcg)(\/(en|ja|zh-tw))?$/)
    }
  })
})

describe('buildCardJsonLd', () => {
  it('@graph 含 BreadcrumbList 與 WebPage(mainEntity: CreativeWork)', () => {
    const card = baseCard()
    const jsonLd = buildCardJsonLd(card, buildCardBreadcrumbItems(card, labels))
    expect(jsonLd['@context']).toBe('https://schema.org')
    const graph = jsonLd['@graph'] as Record<string, unknown>[]
    expect(graph[0]['@type']).toBe('BreadcrumbList')
    expect(graph[1]['@type']).toBe('WebPage')
    expect((graph[1].mainEntity as Record<string, unknown>)['@type']).toBe('CreativeWork')
  })

  it('不含 Product / offers / price / aggregateRating 任何鍵（誠實原則）', () => {
    const card = baseCard()
    const json = JSON.stringify(buildCardJsonLd(card, buildCardBreadcrumbItems(card, labels)))
    expect(json).not.toContain('Product')
    expect(json).not.toContain('offers')
    expect(json).not.toContain('price')
    expect(json).not.toContain('aggregateRating')
  })

  it('麵包屑四層、position 遞增、末節無 item；item 皆為絕對 URL', () => {
    const card = baseCard()
    const jsonLd = buildCardJsonLd(card, buildCardBreadcrumbItems(card, labels))
    const graph = jsonLd['@graph'] as Array<{ itemListElement?: Array<Record<string, unknown>> }>
    const items = graph[0].itemListElement!
    expect(items).toHaveLength(4)
    expect(items.map((i) => i.position)).toEqual([1, 2, 3, 4])
    expect(items[3].item).toBeUndefined()
    for (const item of items.slice(0, 3)) {
      expect(item.item).toMatch(/^https?:\/\//)
    }
  })

  it('inLanguage 三語對映：EN→en、JA→ja、ZH_TW→zh-TW', () => {
    expect(CARD_JSONLD_LANG.EN).toBe('en')
    expect(CARD_JSONLD_LANG.JA).toBe('ja')
    expect(CARD_JSONLD_LANG.ZH_TW).toBe('zh-TW')

    const jaCard = baseCard({ language: 'JA' })
    const graph = buildCardJsonLd(jaCard, buildCardBreadcrumbItems(jaCard, labels))['@graph'] as Array<{
      inLanguage?: string
    }>
    expect(graph[1].inLanguage).toBe('ja')
  })

  it('OPCG ZH_TW alias 卡：name 為 ZH_TW 卡名、inLanguage zh-TW、image 取 canonical JA 圖', () => {
    const aliasCard = baseCard({
      game: 'OPCG',
      language: 'ZH_TW',
      externalId: 'OP01-001',
      name: '魯夫',
      isCollectible: false,
      imageSmall: '',
      imageLarge: '',
      canonicalCardId: 'ja-card-1',
      canonicalCard: {
        id: 'ja-card-1',
        imageSmall: 'https://www.onepiece-cardgame.com/small.png',
        imageLarge: 'https://www.onepiece-cardgame.com/large.png',
        language: 'JA',
      },
      set: {
        id: 'set-op1-zhtw',
        name: 'ROMANCE DAWN',
        series: '第一彈',
        totalCards: 121,
        releaseDate: new Date('2022-07-08'),
        symbolUrl: null,
        game: 'OPCG',
        language: 'ZH_TW',
        externalId: 'OP01',
        syncedAt: new Date('2026-01-01'),
      },
    })
    const jsonLd = buildCardJsonLd(aliasCard, buildCardBreadcrumbItems(aliasCard, labels))
    const graph = jsonLd['@graph'] as Array<{
      inLanguage?: string
      mainEntity?: { name?: string; image?: string; url?: string }
    }>
    expect(graph[1].mainEntity?.name).toBe('魯夫')
    expect(graph[1].inLanguage).toBe('zh-TW')
    expect(graph[1].mainEntity?.image).toContain('proxy-image')
    expect(graph[1].mainEntity?.url).toContain('/cards/opcg/zh-tw/OP01-001')
  })

  it('proxy 相對圖片（/api/proxy-image?…）補成 SITE_URL 絕對 URL', () => {
    const card = baseCard({
      imageSmall: 'https://asia.pokemon-card.com/small.png',
      imageLarge: 'https://asia.pokemon-card.com/large.png',
    })
    const jsonLd = buildCardJsonLd(card, buildCardBreadcrumbItems(card, labels))
    const graph = jsonLd['@graph'] as Array<{ mainEntity?: { image?: string } }>
    expect(graph[1].mainEntity?.image).toMatch(/^http:\/\/localhost:3000\/api\/proxy-image\?/)
  })

  it('圖片解析為空時省略 image 與 primaryImageOfPage', () => {
    const noImageCard = baseCard({
      isCollectible: false,
      imageSmall: '',
      imageLarge: '',
      canonicalCardId: null,
      canonicalCard: null,
    })
    const jsonLd = buildCardJsonLd(noImageCard, buildCardBreadcrumbItems(noImageCard, labels))
    const graph = jsonLd['@graph'] as Array<{ mainEntity?: Record<string, unknown>; primaryImageOfPage?: unknown }>
    expect(graph[1].mainEntity).not.toHaveProperty('image')
    expect(graph[1]).not.toHaveProperty('primaryImageOfPage')
  })

  // 條件輸出（硬約束 2）——逐項獨立
  it('rarity 為 null 時不輸出 rarity property', () => {
    const card = baseCard({ rarity: null })
    const jsonLd = buildCardJsonLd(card, buildCardBreadcrumbItems(card, labels))
    const graph = jsonLd['@graph'] as Array<{ mainEntity?: { additionalProperty?: Array<{ name: string }> } }>
    const props = graph[1].mainEntity?.additionalProperty ?? []
    expect(props.find((p) => p.name === 'rarity')).toBeUndefined()
  })

  it('supertype 為空字串時不輸出 supertype property', () => {
    const card = baseCard({ supertype: '' })
    const jsonLd = buildCardJsonLd(card, buildCardBreadcrumbItems(card, labels))
    const graph = jsonLd['@graph'] as Array<{ mainEntity?: { additionalProperty?: Array<{ name: string }> } }>
    const props = graph[1].mainEntity?.additionalProperty ?? []
    expect(props.find((p) => p.name === 'supertype')).toBeUndefined()
  })

  it('hp 為 null 時不輸出 hp property（hp=0 仍輸出）', () => {
    const nullHpCard = baseCard({ hp: null })
    const graphNull = buildCardJsonLd(nullHpCard, buildCardBreadcrumbItems(nullHpCard, labels))[
      '@graph'
    ] as Array<{ mainEntity?: { additionalProperty?: Array<{ name: string; value: unknown }> } }>
    expect(graphNull[1].mainEntity?.additionalProperty?.find((p) => p.name === 'hp')).toBeUndefined()

    const zeroHpCard = baseCard({ hp: 0 })
    const graphZero = buildCardJsonLd(zeroHpCard, buildCardBreadcrumbItems(zeroHpCard, labels))[
      '@graph'
    ] as Array<{ mainEntity?: { additionalProperty?: Array<{ name: string; value: unknown }> } }>
    expect(graphZero[1].mainEntity?.additionalProperty?.find((p) => p.name === 'hp')?.value).toBe(0)
  })

  it('types 為空陣列時不輸出 types property', () => {
    const card = baseCard({ types: [] })
    const jsonLd = buildCardJsonLd(card, buildCardBreadcrumbItems(card, labels))
    const graph = jsonLd['@graph'] as Array<{ mainEntity?: { additionalProperty?: Array<{ name: string }> } }>
    const props = graph[1].mainEntity?.additionalProperty ?? []
    expect(props.find((p) => p.name === 'types')).toBeUndefined()
  })

  it('set.releaseDate 為 null 時不輸出 datePublished', () => {
    const card = baseCard({ set: { ...baseCard().set, releaseDate: null } })
    const jsonLd = buildCardJsonLd(card, buildCardBreadcrumbItems(card, labels))
    const graph = jsonLd['@graph'] as Array<{ mainEntity?: Record<string, unknown> }>
    expect(graph[1].mainEntity).not.toHaveProperty('datePublished')
  })

  it('所有屬性皆空時連 additionalProperty 鍵都不出現（cardNumber 仍必出）', () => {
    const card = baseCard({ rarity: null, supertype: '', hp: null, types: [] })
    const jsonLd = buildCardJsonLd(card, buildCardBreadcrumbItems(card, labels))
    const graph = jsonLd['@graph'] as Array<{ mainEntity?: { additionalProperty?: Array<{ name: string }> } }>
    const props = graph[1].mainEntity?.additionalProperty
    expect(props).toHaveLength(1)
    expect(props?.[0].name).toBe('cardNumber')
  })

  it('releaseDate 為字串（unstable_cache hit）或 Date（miss）皆輸出 YYYY-MM-DD', () => {
    const dateCard = baseCard()
    const stringCard = baseCard({
      set: { ...baseCard().set, releaseDate: '2023-08-11T00:00:00.000Z' as unknown as Date },
    })
    const graphDate = buildCardJsonLd(dateCard, buildCardBreadcrumbItems(dateCard, labels))['@graph'] as Array<{
      mainEntity?: { datePublished?: string }
    }>
    const graphString = buildCardJsonLd(stringCard, buildCardBreadcrumbItems(stringCard, labels))[
      '@graph'
    ] as Array<{ mainEntity?: { datePublished?: string } }>
    expect(graphDate[1].mainEntity?.datePublished).toBe('2023-08-11')
    expect(graphString[1].mainEntity?.datePublished).toBe('2023-08-11')
  })
})
