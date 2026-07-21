import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: { count: vi.fn(), findMany: vi.fn() },
  },
}))

import {
  ALLOWED_PATHS,
  DISALLOWED_PATHS,
  STATIC_ROUTES,
  buildSitemapIndex,
  buildUrlSet,
  cardChunkToPaths,
  escapeXml,
  getCardChunk,
  getCardCount,
  parseSitemapChildId,
  SITEMAP_CHUNK_SIZE,
  sitemapChildPaths,
} from '../sitemap'
import { prisma } from '@/lib/prisma'
import { protectedRoutes } from '@/lib/auth.config'

describe('escapeXml', () => {
  it('轉義 & < > " \'', () => {
    expect(escapeXml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&apos;')
  })
})

describe('buildUrlSet', () => {
  it('產出合法 urlset，<loc> 為 SITE_URL 絕對化路徑', () => {
    const xml = buildUrlSet(['/cards', '/terms'])
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<loc>http://localhost:3000/cards</loc>')
    expect(xml).toContain('<loc>http://localhost:3000/terms</loc>')
  })

  it('不輸出 lastmod / changefreq / priority', () => {
    const xml = buildUrlSet(['/cards'])
    expect(xml).not.toContain('lastmod')
    expect(xml).not.toContain('changefreq')
    expect(xml).not.toContain('priority')
  })
})

describe('buildSitemapIndex', () => {
  it('產出合法 sitemapindex', () => {
    const xml = buildSitemapIndex(['/sitemaps/static.xml', '/sitemaps/cards-0.xml'])
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<loc>http://localhost:3000/sitemaps/static.xml</loc>')
    expect(xml).toContain('<loc>http://localhost:3000/sitemaps/cards-0.xml</loc>')
  })
})

describe('sitemapChildPaths', () => {
  it('4 個 chunk 回 static.xml + cards-0..3.xml', () => {
    expect(sitemapChildPaths(4)).toEqual([
      '/sitemaps/static.xml',
      '/sitemaps/cards-0.xml',
      '/sitemaps/cards-1.xml',
      '/sitemaps/cards-2.xml',
      '/sitemaps/cards-3.xml',
    ])
  })
})

describe('parseSitemapChildId', () => {
  it('static.xml 解析為 static target', () => {
    expect(parseSitemapChildId('static.xml')).toEqual({ kind: 'static' })
  })

  it('cards-{n}.xml 解析為 cards target 並取出序號', () => {
    expect(parseSitemapChildId('cards-3.xml')).toEqual({ kind: 'cards', index: 3 })
  })

  it('非法格式回 null', () => {
    expect(parseSitemapChildId('cards-abc.xml')).toBeNull()
    expect(parseSitemapChildId('other.xml')).toBeNull()
    expect(parseSitemapChildId('')).toBeNull()
  })
})

describe('STATIC_ROUTES / DISALLOWED_PATHS', () => {
  it('STATIC_ROUTES 不含任何受保護路徑', () => {
    for (const protectedRoute of protectedRoutes) {
      expect(STATIC_ROUTES).not.toContain(protectedRoute)
    }
  })

  it('DISALLOWED_PATHS 覆蓋 auth.config.ts 的 protectedRoutes 全部項目', () => {
    for (const protectedRoute of protectedRoutes) {
      expect(DISALLOWED_PATHS).toContain(protectedRoute)
    }
  })

  it('DISALLOWED_PATHS 覆蓋全部 token/信件導向的 auth 流程頁（無索引價值、內容隨 token 變動）', () => {
    for (const route of ['/verify-email', '/verify-signup', '/reset-password', '/resend-verification']) {
      expect(DISALLOWED_PATHS).toContain(route)
      expect(STATIC_ROUTES).not.toContain(route)
    }
  })
})

describe('ALLOWED_PATHS', () => {
  it('放行 /api/proxy-image（供卡片頁 JSON-LD schema image 可被 Googlebot 抓取）', () => {
    expect(ALLOWED_PATHS).toContain('/api/proxy-image')
  })

  it('DISALLOWED_PATHS 仍保留 /api/（robots.txt 最長匹配讓 Allow: /api/proxy-image 例外生效）', () => {
    expect(DISALLOWED_PATHS).toContain('/api/')
  })
})

describe('getCardCount / getCardChunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getCardCount 呼叫 prisma.card.count', async () => {
    vi.mocked(prisma.card.count).mockResolvedValue(74123)
    const count = await getCardCount()
    expect(count).toBe(74123)
  })

  it('getCardChunk 依 id 升冪、skip/take 正確切塊，where 不帶任何條件', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    await getCardChunk(2)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { game: true, language: true, externalId: true },
        orderBy: { id: 'asc' },
        skip: 2 * SITEMAP_CHUNK_SIZE,
        take: SITEMAP_CHUNK_SIZE,
      }),
    )
    expect(prisma.card.findMany).not.toHaveBeenCalledWith(expect.objectContaining({ where: expect.anything() }))
  })
})

describe('cardChunkToPaths', () => {
  it('轉換為 cardPath 相對路徑（含 OPCG ZH_TW alias）', () => {
    const paths = cardChunkToPaths([
      { game: 'PTCG', language: 'EN', externalId: 'sv3-25' },
      { game: 'OPCG', language: 'ZH_TW', externalId: 'OP01-001' },
    ])
    expect(paths).toEqual(['/cards/ptcg/en/sv3-25', '/cards/opcg/zh-tw/OP01-001'])
  })
})
