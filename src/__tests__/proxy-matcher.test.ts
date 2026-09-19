// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, type NextFetchEvent } from 'next/server'

// proxy.ts calls NextAuth(authConfig) at module load. The mock records which paths
// actually went through NextAuth and lets each test choose the session.
const authState = vi.hoisted(() => ({
  calls: [] as string[],
  session: null as null | { user: { id: string } },
}))

vi.mock('next-auth', () => ({
  default: () => ({
    auth:
      (handler: (req: NextRequest & { auth: unknown }, ev: unknown) => Response) =>
      async (req: NextRequest, ev: unknown) => {
        authState.calls.push(req.nextUrl.pathname)
        return handler(Object.assign(req, { auth: authState.session }), ev)
      },
  }),
}))

import { config, proxy } from '../proxy'
import { protectedRoutes } from '@/lib/auth.config'

const matchers = config.matcher.map((pattern) => new RegExp(`^${pattern}$`))
const isMatched = (path: string) => matchers.some((re) => re.test(path))

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, 'https://pocketbindr.test'), { headers })
}

async function run(path: string, headers?: Record<string, string>) {
  return proxy(request(path, headers), {} as NextFetchEvent)
}

const rewrittenPath = (res: Response) => {
  const target = res.headers.get('x-middleware-rewrite')
  return target ? new URL(target).pathname : null
}

beforeEach(() => {
  authState.calls = []
  authState.session = null
})

describe('proxy matcher', () => {
  it.each(['/', '/cards', '/cards/ptcg/ja/ja-043066', '/b/abc123', '/terms', '/login'])(
    '涵蓋公開頁面 %s（需要 locale rewrite）',
    (path) => {
      expect(isMatched(path)).toBe(true)
    },
  )

  it('涵蓋每一條 protectedRoutes（NextAuth 導向需要）', () => {
    for (const route of protectedRoutes) {
      expect(isMatched(route)).toBe(true)
      expect(isMatched(`${route}/some-id`)).toBe(true)
    }
  })

  it.each([
    '/api/cards',
    '/api/auth/session',
    '/_next/static/chunks/app.js',
    '/sitemap.xml',
    '/sitemaps/cards-0.xml',
    '/robots.txt',
    '/opengraph-image',
    '/cards/ptcg/ja/ja-043066/opengraph-image',
    '/b/abc123/opengraph-image',
    '/favicon.ico',
    '/logo-dark.png',
    '/manifest.json',
    '/fonts/NotoSansJP-Regular.otf',
  ])('排除留在 root 層的路由與靜態檔 %s', (path) => {
    expect(isMatched(path)).toBe(false)
  })
})

describe('proxy locale rewrite', () => {
  it('無 cookie、無 Accept-Language → 內部 rewrite 到 /zh-TW', async () => {
    const res = await run('/cards/ptcg/ja/ja-043066')
    expect(rewrittenPath(res)).toBe('/zh-TW/cards/ptcg/ja/ja-043066')
  })

  it('首頁 rewrite 為 /{locale}（不留尾斜線）', async () => {
    const res = await run('/', { cookie: 'NEXT_LOCALE=ja' })
    expect(rewrittenPath(res)).toBe('/ja')
  })

  it('NEXT_LOCALE cookie 優先於 Accept-Language', async () => {
    const res = await run('/terms', { cookie: 'NEXT_LOCALE=en', 'accept-language': 'ja-JP' })
    expect(rewrittenPath(res)).toBe('/en/terms')
  })

  it.each([
    ['zh-Hant-TW', 'zh-TW'],
    ['zh-Hant', 'zh-TW'],
    ['zh', 'zh-TW'],
    ['ja-JP,ja;q=0.9', 'ja'],
    ['fr;q=1, en;q=0.8', 'en'],
  ])('Accept-Language %s → %s（沿用 matchAcceptLanguage）', async (header, locale) => {
    const res = await run('/cards', { 'accept-language': header })
    expect(rewrittenPath(res)).toBe(`/${locale}/cards`)
  })

  it('把 locale 帶給 next-intl（X-NEXT-INTL-LOCALE request header）', async () => {
    const res = await run('/cards', { cookie: 'NEXT_LOCALE=en' })
    expect(res.headers.get('x-middleware-request-x-next-intl-locale')).toBe('en')
  })

  it('保留 query string', async () => {
    const res = await run('/cards?game=ptcg&setId=abc')
    const target = new URL(res.headers.get('x-middleware-rewrite')!)
    expect(target.search).toBe('?game=ptcg&setId=abc')
  })
})

describe('proxy NextAuth 範圍', () => {
  it.each(['/', '/cards', '/cards/ptcg/ja/ja-043066', '/b/abc123', '/terms'])(
    '公開路由 %s 不進 NextAuth（避免 JWT 解密與 session cookie 重簽）',
    async (path) => {
      await run(path)
      expect(authState.calls).toEqual([])
    },
  )

  it('受保護路由未登入 → 307 導向 /login 並帶 callbackUrl', async () => {
    for (const route of protectedRoutes) {
      const res = await run(`${route}/x`)
      expect(res.status).toBe(307)
      const location = new URL(res.headers.get('location')!)
      expect(location.pathname).toBe('/login')
      expect(location.searchParams.get('callbackUrl')).toBe(`https://pocketbindr.test${route}/x`)
    }
    expect(authState.calls).toEqual(protectedRoutes.map((r) => `${r}/x`))
  })

  it('受保護路由已登入 → 照常 locale rewrite', async () => {
    authState.session = { user: { id: 'u1' } }
    const res = await run('/binders/abc', { cookie: 'NEXT_LOCALE=ja' })
    expect(rewrittenPath(res)).toBe('/ja/binders/abc')
  })
})
