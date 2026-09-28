import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { card: { count: vi.fn(), findMany: vi.fn() } },
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('sitemap / robots（總開關已設 NEXT_PUBLIC_CARD_PAGES_ORIGIN）', () => {
  it('sitemapChildPaths 只回 static.xml，忽略 chunkCount', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', 'https://cards.pocketbindr.app')
    const { sitemapChildPaths } = await import('../sitemap')
    expect(sitemapChildPaths(4)).toEqual(['/sitemaps/static.xml'])
  })

  it('EMERGENCY_DISALLOWED_PATHS 改為 /cards$ 與 /cards?*，不再前綴擋整個 /cards/', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', 'https://cards.pocketbindr.app')
    const { EMERGENCY_DISALLOWED_PATHS, DISALLOWED_PATHS } = await import('../sitemap')
    expect(EMERGENCY_DISALLOWED_PATHS).toEqual(['/cards$', '/cards?*'])
    expect(DISALLOWED_PATHS).not.toContain('/cards')
    expect(DISALLOWED_PATHS).toContain('/cards$')
    expect(DISALLOWED_PATHS).toContain('/cards?*')
  })

  it('未設開關時仍維持既有緊急封鎖（前綴 /cards）', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', '')
    const { EMERGENCY_DISALLOWED_PATHS } = await import('../sitemap')
    expect(EMERGENCY_DISALLOWED_PATHS).toEqual(['/cards'])
  })
})
