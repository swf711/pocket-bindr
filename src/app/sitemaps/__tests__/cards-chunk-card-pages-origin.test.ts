import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { card: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([]) } },
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('GET /sitemaps/[id]（總開關已設）', () => {
  it('cards-0.xml 回 404，static.xml 仍正常回傳', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', 'https://cards.pocketbindr.app')
    const { GET } = await import('../[id]/route')

    const cardsRes = await GET({} as Request, { params: Promise.resolve({ id: 'cards-0.xml' }) })
    expect(cardsRes.status).toBe(404)

    const staticRes = await GET({} as Request, { params: Promise.resolve({ id: 'static.xml' }) })
    expect(staticRes.status).toBe(200)
    expect(await staticRes.text()).toContain('<urlset')
  })
})
