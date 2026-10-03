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

  it('CARD_LIST_DISALLOWED_PATHS 只擋 /cards?*，放行 /cards 列表頁本身', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', 'https://cards.pocketbindr.app')
    const { CARD_LIST_DISALLOWED_PATHS, DISALLOWED_PATHS } = await import('../sitemap')
    expect(CARD_LIST_DISALLOWED_PATHS).toEqual(['/cards?*'])
    expect(DISALLOWED_PATHS).not.toContain('/cards')
    expect(DISALLOWED_PATHS).not.toContain('/cards$')
    expect(DISALLOWED_PATHS).toContain('/cards?*')
  })

  it('sitemap 列出的靜態路由都不得被 robots 擋（robots 與 sitemap 不可互相矛盾）', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', 'https://cards.pocketbindr.app')
    const { STATIC_ROUTES, DISALLOWED_PATHS } = await import('../sitemap')
    for (const route of STATIC_ROUTES) {
      for (const rule of DISALLOWED_PATHS) {
        expect(robotsRuleMatches(rule, route), `${route} blocked by ${rule}`).toBe(false)
      }
    }
  })

  it('未設開關時沿用前綴 /cards 封鎖', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARD_PAGES_ORIGIN', '')
    const { CARD_LIST_DISALLOWED_PATHS } = await import('../sitemap')
    expect(CARD_LIST_DISALLOWED_PATHS).toEqual(['/cards'])
  })
})

/** Minimal robots.txt rule matcher (prefix match, `*` wildcard, trailing `$` anchor). */
function robotsRuleMatches(rule: string, path: string): boolean {
  const anchored = rule.endsWith('$')
  const body = (anchored ? rule.slice(0, -1) : rule)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*')
  return new RegExp(`^${body}${anchored ? '$' : ''}`).test(path)
}
