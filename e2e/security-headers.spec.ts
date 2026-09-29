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
      // Report-Only 階段不可有會實際阻擋的 CSP
      expect(headers['content-security-policy']).toBeUndefined()
    })
  }

  test('API 路由同樣帶 header', async ({ request }) => {
    const res = await request.get('/api/sets?game=PTCG&language=EN')
    expect(res.headers()['x-content-type-options']).toBe('nosniff')
  })
})
