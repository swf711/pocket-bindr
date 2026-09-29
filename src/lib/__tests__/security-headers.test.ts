import { describe, it, expect } from 'vitest'
import { buildCsp, SECURITY_HEADERS } from '../security-headers'

describe('buildCsp', () => {
  const csp = buildCsp()

  it('包含必要的收斂 directive', () => {
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("object-src 'none'")
  })

  it('form-action 允許 OAuth provider（表單 POST 會 redirect 到它們）', () => {
    const formAction = csp.split('; ').find((d) => d.startsWith('form-action'))
    expect(formAction).toContain("'self'")
    expect(formAction).toContain('https://accounts.google.com')
    expect(formAction).toContain('https://discord.com')
  })

  it('script-src 放行 Vercel Analytics', () => {
    const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src'))
    expect(scriptSrc).toContain('https://va.vercel-scripts.com')
  })

  it('directive 之間以 "; " 分隔且無多餘空白', () => {
    expect(csp).not.toMatch(/;;|\s{2,}|;$/)
  })
})

describe('SECURITY_HEADERS', () => {
  const byKey = Object.fromEntries(SECURITY_HEADERS.map((h) => [h.key, h.value]))

  it('四項基本 header 皆存在', () => {
    expect(byKey['X-Content-Type-Options']).toBe('nosniff')
    expect(byKey['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(byKey['X-Frame-Options']).toBe('DENY')
    expect(byKey['Permissions-Policy']).toContain('camera=()')
  })

  it('CSP 只以 Report-Only 形式出現（不可意外 enforce）', () => {
    expect(byKey['Content-Security-Policy-Report-Only']).toBe(buildCsp())
    expect(byKey['Content-Security-Policy']).toBeUndefined()
  })
})
