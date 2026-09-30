import { describe, it, expect } from 'vitest'
import { cardPublicPath } from '@/lib/card-url'
import { objectKeyFor } from '../sync'
import {
  cardPageUrl,
  buildSubdomainRobotsTxt,
  buildSubdomainSitemapIndex,
  buildSubdomainUrlSet,
} from '../seo'

const ORIGIN = 'https://cards.example.com'

describe('cardPageUrl', () => {
  it('externalId 含 ? 或 ! 時產出編碼網址（? 不可成為 query 起點）', () => {
    expect(cardPageUrl(ORIGIN, { game: 'PTCG', language: 'EN', externalId: 'ex10-?' })).toBe(
      `${ORIGIN}/ptcg/en/ex10-%3F`,
    )
    expect(cardPageUrl(ORIGIN, { game: 'PTCG', language: 'EN', externalId: 'ex10-!' })).toBe(
      `${ORIGIN}/ptcg/en/ex10-!`,
    )
  })

  it('與 canonical 用的 cardPublicPath 逐字元一致', () => {
    const card = { game: 'OPCG' as const, language: 'ZH_TW' as const, externalId: 'OP01-001_p1' }
    expect(cardPageUrl(ORIGIN, card)).toBe(`${ORIGIN}${cardPublicPath(card)}`)
  })

  it('R2 物件 key 維持解碼形，兩者刻意不同', () => {
    const card = { game: 'PTCG' as const, language: 'EN' as const, externalId: 'ex10-?' }
    expect(objectKeyFor(card)).toBe('ptcg/en/ex10-?')
    expect(cardPageUrl(ORIGIN, card)).not.toContain('ex10-?')
  })
})

describe('sitemap / robots', () => {
  it('robots 指向子網域 sitemap', () => {
    expect(buildSubdomainRobotsTxt(ORIGIN)).toBe(`User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`)
  })

  it('sitemap index 依分塊數列出子檔', () => {
    const xml = buildSubdomainSitemapIndex(ORIGIN, 2)
    expect(xml).toContain(`<loc>${ORIGIN}/sitemaps/cards-0.xml</loc>`)
    expect(xml).toContain(`<loc>${ORIGIN}/sitemaps/cards-1.xml</loc>`)
    expect(xml).not.toContain('cards-2.xml')
  })

  it('urlset 原樣收下已編碼網址，並跳脫 XML 特殊字元', () => {
    const xml = buildSubdomainUrlSet([`${ORIGIN}/ptcg/en/ex10-%3F`, `${ORIGIN}/a&b`])
    expect(xml).toContain(`<loc>${ORIGIN}/ptcg/en/ex10-%3F</loc>`)
    expect(xml).toContain(`<loc>${ORIGIN}/a&amp;b</loc>`)
  })
})
