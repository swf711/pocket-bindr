import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: { count: vi.fn(), findMany: vi.fn() },
  },
}))

import { GET } from '../route'
import { SITEMAP_CACHE_CONTROL } from '@/lib/sitemap'
import { prisma } from '@/lib/prisma'

describe('GET /sitemap.xml', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.card.count).mockResolvedValue(25_000)
  })

  it('回 200、content-type 為 application/xml、帶 SITEMAP_CACHE_CONTROL', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/xml')
    expect(res.headers.get('Cache-Control')).toBe(SITEMAP_CACHE_CONTROL)
  })

  it('回傳 sitemapindex，含依卡片數算出的子檔', async () => {
    const body = await (await GET()).text()
    expect(body).toContain('<sitemapindex')
    expect(body).toContain('/sitemaps/static.xml')
    expect(body).toContain('/sitemaps/cards-0.xml')
    expect(body).toContain('/sitemaps/cards-1.xml')
  })
})
