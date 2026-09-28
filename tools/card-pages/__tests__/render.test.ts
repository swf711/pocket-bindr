import { describe, it, expect, beforeAll } from 'vitest'
import { renderCardPage } from '../render'
import { extractThemeTokens } from '../css'
import { buildCardBreadcrumbItems, buildCardJsonLd } from '@/lib/card-jsonld'
import { CARD_UI_LOCALE } from '@/lib/card-url'
import { SITE_URL } from '@/lib/og'
import type { PublicCardRow, SameSetCardRow } from '@/lib/public-card-queries'

const CSS = extractThemeTokens(`
:root, .light { --background: oklch(98% 0 0); --primary: oklch(50% 0 0); }
.dark { --background: oklch(10% 0 0); }
`)

const labels = { home: '首頁', cards: '卡牌搜尋' }

function baseCard(overrides: Partial<PublicCardRow> = {}): PublicCardRow {
  return {
    id: 'card-1',
    externalId: 'sv3-25',
    language: 'EN',
    game: 'PTCG',
    name: 'Pikachu <3',
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

function render(card: PublicCardRow, sameSet: SameSetCardRow[] = []) {
  const locale = CARD_UI_LOCALE[card.language]
  const breadcrumbItems = buildCardBreadcrumbItems(card, labels)
  const jsonLd = buildCardJsonLd(card, breadcrumbItems)
  return renderCardPage({ card, sameSet, locale, css: CSS, breadcrumbItems, jsonLd })
}

beforeAll(() => {
  process.env.NEXT_PUBLIC_CARD_PAGES_ORIGIN = 'https://cards.pocketbindr.app'
})

describe('renderCardPage', () => {
  it('DB 字串一律 HTML escape（卡名含 <）', () => {
    const html = render(baseCard())
    expect(html).toContain('Pikachu &lt;3')
    expect(html).not.toContain('Pikachu <3')
  })

  it('JSON-LD 內的 </script> 被跳脫，不提前結束 script 區塊', () => {
    const html = render(baseCard({ name: 'Weird</script><script>alert(1)</script>' }))
    expect(html).not.toContain('</script><script>alert')
    expect(html).toContain('\\u003c/script>')
  })

  it('UI 語系跟卡片語言：EN→en、JA→ja、ZH_TW→zh-TW', () => {
    expect(render(baseCard({ language: 'EN' }))).toContain('<html lang="en">')
    expect(render(baseCard({ language: 'JA', game: 'OPCG', externalId: 'OP01-001' }))).toContain('<html lang="ja">')
    expect(
      render(baseCard({ language: 'ZH_TW', game: 'OPCG', externalId: 'OP01-001' })),
    ).toContain('<html lang="zh-TW">')
  })

  it('缺值欄位（rarity/hp/types/releaseDate）整個省略，不留空欄位', () => {
    const html = render(
      baseCard({
        rarity: null,
        hp: null,
        types: [],
        set: { ...baseCard().set, releaseDate: null },
      }),
    )
    expect(html).not.toContain('>Rarity<')
    expect(html).not.toContain('>HP<')
    expect(html).not.toContain('>Release Date<')
  })

  it('canonical 為自身子網域，og:image 為主站 OG 路由絕對網址', () => {
    const html = render(baseCard())
    expect(html).toContain('<link rel="canonical" href="https://cards.pocketbindr.app/ptcg/en/sv3-25" />')
    expect(html).toContain(`og:image" content="${SITE_URL}/cards/ptcg/en/sv3-25/opengraph-image`)
  })

  it('「開啟」按鈕連到 /cards?game=<enum>&language=<enum>&open=<externalId>', () => {
    const html = render(baseCard())
    expect(html).toContain(`href="${SITE_URL}/cards?game=PTCG&amp;language=EN&amp;open=sv3-25"`)
  })

  it('卡圖 img 皆為絕對網址且帶 referrerpolicy=no-referrer（品牌 logo 為站內固定資產，不受此規範）', () => {
    const html = render(baseCard())
    const imgTags = (html.match(/<img [^>]*>/g) ?? []).filter(tag => !tag.includes('brand-logo'))
    expect(imgTags.length).toBeGreaterThan(0)
    for (const tag of imgTags) {
      const srcMatch = tag.match(/src="([^"]*)"/)
      expect(srcMatch?.[1]?.startsWith('http')).toBe(true)
      expect(tag).toContain('referrerpolicy="no-referrer"')
    }
  })

  it('alias 卡圖片取 canonical（OPCG ZH_TW isCollectible=false）', () => {
    const alias = baseCard({
      game: 'OPCG',
      language: 'ZH_TW',
      externalId: 'OP01-001',
      isCollectible: false,
      canonicalCard: {
        id: 'canonical-1',
        imageSmall: 'https://www.onepiece-cardgame.com/small.png',
        imageLarge: 'https://www.onepiece-cardgame.com/large.png',
        language: 'JA',
      },
    })
    const html = render(alias)
    // 走 /api/proxy-image（官網來源需 Referer，見 getCardImageUrl），故以 URL-encoded 片段比對。
    expect(html).toContain(encodeURIComponent('https://www.onepiece-cardgame.com/large.png'))
  })

  it('複數卡（合成圖）於同系列格線使用 object-contain', () => {
    const sameSet: SameSetCardRow[] = [
      {
        id: 'multi-1',
        name: 'LEGEND Card',
        externalId: 'sv1-1',
        language: 'EN',
        game: 'PTCG',
        cardNumber: '015/016・016/016',
        isCollectible: true,
        imageSmall: 'https://images.pokemontcg.io/legend.png',
        imageLarge: 'https://images.pokemontcg.io/legend_hires.png',
        canonicalCard: null,
      },
    ]
    const html = render(baseCard(), sameSet)
    expect(html).toContain('object-fit:contain')
  })

  it('一般同系列卡使用 object-cover', () => {
    const sameSet: SameSetCardRow[] = [
      {
        id: 'normal-1',
        name: 'Normal Card',
        externalId: 'sv1-2',
        language: 'EN',
        game: 'PTCG',
        cardNumber: '002',
        isCollectible: true,
        imageSmall: 'https://images.pokemontcg.io/2.png',
        imageLarge: 'https://images.pokemontcg.io/2_hires.png',
        canonicalCard: null,
      },
    ]
    const html = render(baseCard(), sameSet)
    expect(html).toContain('object-fit:cover')
  })
})
