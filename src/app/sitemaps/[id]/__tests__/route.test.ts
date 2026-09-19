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

function req() {
  return new Request('http://localhost/sitemaps/static.xml')
}

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /sitemaps/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.card.count).mockResolvedValue(10)
    vi.mocked(prisma.card.findMany).mockResolvedValue([
      { game: 'PTCG', language: 'EN', externalId: 'sv3-25' },
    ] as never)
  })

  it('static.xml 回 200 且帶 SITEMAP_CACHE_CONTROL', async () => {
    const res = await GET(req(), params('static.xml'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/xml')
    expect(res.headers.get('Cache-Control')).toBe(SITEMAP_CACHE_CONTROL)
  })

  it('cards-0.xml 回 200 且帶 SITEMAP_CACHE_CONTROL', async () => {
    const res = await GET(req(), params('cards-0.xml'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/xml')
    expect(res.headers.get('Cache-Control')).toBe(SITEMAP_CACHE_CONTROL)
  })

  it('非法 id 回 404，且為 no-store（錯誤回應不得進共享快取）', async () => {
    const res = await GET(req(), params('not-a-real-file.xml'))
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('chunk index 越界回 404 且為 no-store', async () => {
    const res = await GET(req(), params('cards-99.xml'))
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
