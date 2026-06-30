import { describe, it, expect } from 'vitest'
import { isActiveNavLink, NAV_ACTIVE_CLASS } from '../nav-utils'

describe('isActiveNavLink', () => {
  it("'/' 僅在 pathname === '/' 時 active", () => {
    expect(isActiveNavLink('/', '/')).toBe(true)
    expect(isActiveNavLink('/cards', '/')).toBe(false)
    expect(isActiveNavLink('/binders/123', '/')).toBe(false)
  })

  it('/binders 在 /binders active', () => {
    expect(isActiveNavLink('/binders', '/binders')).toBe(true)
  })

  it('/binders 在 /binders/123 active（子頁高亮父層）', () => {
    expect(isActiveNavLink('/binders/123', '/binders')).toBe(true)
    expect(isActiveNavLink('/binders/abc-def-123', '/binders')).toBe(true)
  })

  it('不同 route 不互相 active', () => {
    expect(isActiveNavLink('/collection', '/cards')).toBe(false)
    expect(isActiveNavLink('/cards', '/collection')).toBe(false)
  })

  it('不被前綴相同但非路徑分界的 route 誤判', () => {
    // /bindersX 不應讓 /binders active（startsWith 以 '/' 為界）
    expect(isActiveNavLink('/bindersX', '/binders')).toBe(false)
  })

  it('NAV_ACTIVE_CLASS 為預期 token', () => {
    expect(NAV_ACTIVE_CLASS).toContain('bg-secondary-container')
    expect(NAV_ACTIVE_CLASS).toContain('text-on-secondary-container')
  })
})
