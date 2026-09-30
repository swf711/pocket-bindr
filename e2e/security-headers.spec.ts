import { test, expect } from './helpers/test'

test.describe('安全 header', () => {
  for (const path of ['/', '/cards', '/login']) {
    test(`${path} 回應帶基本四項 header 與 CSP Report-Only`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(200)
      const headers = res.headers()

      expect(headers['x-content-type-options']).toBe('nosniff')
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
      expect(headers['x-frame-options']).toBe('DENY')
      expect(headers['permissions-policy']).toContain('camera=()')

      expect(headers['content-security-policy-report-only']).toContain("frame-ancestors 'none'")
      // Must stay report-only: an enforcing CSP would block the inline scripts
      expect(headers['content-security-policy']).toBeUndefined()
    })
  }

  test('API 路由同樣帶 header', async ({ request }) => {
    const res = await request.get('/api/sets?game=PTCG&language=EN')
    expect(res.headers()['x-content-type-options']).toBe('nosniff')
  })
})

test.describe('帳號頁 noindex', () => {
  for (const path of ['/login', '/register', '/forgot-password']) {
    test(`${path} 帶 noindex 且允許跟隨連結`, async ({ request }) => {
      const html = await (await request.get(path)).text()
      const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? ''
      expect(robots).toContain('noindex')
      expect(robots).toContain('follow')
    })
  }

  test('公開內容頁（首頁）不受影響', async ({ request }) => {
    const html = await (await request.get('/')).text()
    expect(html).not.toMatch(/<meta name="robots" content="[^"]*noindex/)
  })
})
