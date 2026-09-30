import type { Game, Language } from '@prisma/client'
import { cardPublicPath } from '@/lib/card-url'

/**
 * Crawler-facing outputs of the card-pages subdomain (robots.txt, sitemaps, public card URLs).
 *
 * Every public card URL goes through `cardPageUrl`, which reuses `cardPublicPath` (externalId is
 * `encodeURIComponent`-ed) so the sitemap, IndexNow submissions and the page canonical are
 * byte-identical. The R2 object key (`objectKeyFor`) is intentionally the *decoded* form and must
 * never be used as a URL: an externalId such as `ex10-?` would turn into a query string.
 */

type CardIdentity = { game: Game; language: Language; externalId: string }

export function cardPageUrl(origin: string, card: CardIdentity): string {
  return `${origin}${cardPublicPath(card)}`
}

export function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildSubdomainRobotsTxt(origin: string): string {
  return `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
}

export function buildSubdomainSitemapIndex(origin: string, chunkCount: number): string {
  const entries = Array.from(
    { length: chunkCount },
    (_, i) => `  <sitemap>\n    <loc>${xmlEscape(`${origin}/sitemaps/cards-${i}.xml`)}</loc>\n  </sitemap>`,
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`
}

export function buildSubdomainUrlSet(urls: readonly string[]): string {
  const entries = urls.map(url => `  <url>\n    <loc>${xmlEscape(url)}</loc>\n  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`
}
