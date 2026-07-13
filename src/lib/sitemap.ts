import { unstable_cache } from 'next/cache'
import type { Game, Language } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { cardPath } from '@/lib/card-url'
import { SITE_URL } from '@/lib/og'

/** 每個卡片 sitemap 子檔的 URL 上限，遠低於官方 50,000 硬上限，預留成長空間。 */
export const SITEMAP_CHUNK_SIZE = 20_000

/** 進 sitemap 的公開靜態路徑（不含 auth / verify / 受保護頁）。 */
export const STATIC_ROUTES: readonly string[] = ['/', '/cards', '/terms', '/privacy']

/** robots Disallow 清單：受保護路由（見 src/lib/auth.config.ts）+ API + token 流程頁。 */
export const DISALLOWED_PATHS: readonly string[] = [
  '/api/',
  '/binders',
  '/settings',
  '/collection',
  '/verify-email',
  '/verify-signup',
  '/reset-password',
]

/**
 * robots Allow 例外：`/api/` 整包 Disallow，但卡圖代理需放行，否則走 proxy 的卡
 * （PTCG JA/ZH_TW、OPCG 官網圖，約 39k+ 張）其 JSON-LD/schema image Google 抓不到。
 * robots.txt 以最長匹配優先，`Allow: /api/proxy-image` 會勝過 `Disallow: /api/`，
 * 兩條規則並存不衝突。不涉及 rate-limit（見 src/lib/rate-limit.ts，B1 刻意不動）。
 */
export const ALLOWED_PATHS: readonly string[] = ['/', '/api/proxy-image']

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** paths 為相對路徑；內部以 SITE_URL 絕對化。刻意不輸出 lastmod/changefreq/priority（見 CLAUDE.md 決策）。 */
export function buildUrlSet(paths: readonly string[]): string {
  const urls = paths
    .map(path => `  <url>\n    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
}

export function buildSitemapIndex(paths: readonly string[]): string {
  const entries = paths
    .map(path => `  <sitemap>\n    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>\n  </sitemap>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`
}

/** 子 sitemap 的相對路徑清單（index 用）：['/sitemaps/static.xml', '/sitemaps/cards-0.xml', …]。 */
export function sitemapChildPaths(chunkCount: number): string[] {
  const cardPaths = Array.from({ length: chunkCount }, (_, i) => `/sitemaps/cards-${i}.xml`)
  return ['/sitemaps/static.xml', ...cardPaths]
}

/** 依 chunk index 解析出的目標：static 子檔或 cards 子檔（含 chunk 序號）。 */
export type SitemapChildTarget = { kind: 'static' } | { kind: 'cards'; index: number }

/** 解析 [id] route 收到的檔名；不合法格式回 null（route 應回 404）。 */
export function parseSitemapChildId(id: string): SitemapChildTarget | null {
  if (id === 'static.xml') return { kind: 'static' }
  const match = id.match(/^cards-(\d+)\.xml$/)
  if (!match) return null
  return { kind: 'cards', index: Number(match[1]) }
}

/** 全站可索引卡片總數，快取 86400 秒（比照 public-card.ts 的 unstable_cache 慣例）。 */
export function getCardCount(): Promise<number> {
  return unstable_cache(() => prisma.card.count(), ['sitemap-card-count'], { revalidate: 86400 })()
}

type CardSitemapRow = { game: Game; language: Language; externalId: string }

/** 依 id 升冪切出第 index 塊（0-based）卡片；where 刻意不帶任何條件，OPCG ZH_TW alias 亦納入。 */
export function getCardChunk(index: number): Promise<CardSitemapRow[]> {
  return unstable_cache(
    () =>
      prisma.card.findMany({
        select: { game: true, language: true, externalId: true },
        orderBy: { id: 'asc' },
        skip: index * SITEMAP_CHUNK_SIZE,
        take: SITEMAP_CHUNK_SIZE,
      }),
    ['sitemap-card-chunk', String(index)],
    { revalidate: 86400 },
  )()
}

export function cardChunkToPaths(rows: readonly CardSitemapRow[]): string[] {
  return rows.map(row => cardPath(row))
}
