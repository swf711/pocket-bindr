import { describe, it, expect, vi } from 'vitest'

vi.mock('node:dns/promises', () => ({
  resolveMx: vi.fn(),
}))

import { resolveMx } from 'node:dns/promises'
import { isDisposableEmailDomain, hasValidMxRecord } from '../email-precheck'

describe('isDisposableEmailDomain', () => {
  it('已知拋棄式網域回傳 true', () => {
    expect(isDisposableEmailDomain('test@mailinator.com')).toBe(true)
  })

  it('一般網域回傳 false', () => {
    expect(isDisposableEmailDomain('test@gmail.com')).toBe(false)
  })

  it('大小寫不敏感', () => {
    expect(isDisposableEmailDomain('TEST@MAILINATOR.COM')).toBe(true)
  })

  it('格式異常（無 @）回傳 false，不擋（交由 zod email() 處理格式）', () => {
    expect(isDisposableEmailDomain('not-an-email')).toBe(false)
  })
})

describe('hasValidMxRecord（fail-open）', () => {
  it('查詢成功且有 MX record → true', async () => {
    vi.mocked(resolveMx).mockResolvedValue([{ exchange: 'mx.example.com', priority: 10 }])
    expect(await hasValidMxRecord('test@example.com')).toBe(true)
  })

  it('查詢成功但查無 MX record → false（明確判定無效網域）', async () => {
    vi.mocked(resolveMx).mockResolvedValue([])
    expect(await hasValidMxRecord('test@no-mx.example.com')).toBe(false)
  })

  it('DNS 查詢失敗（ENOTFOUND 等）→ fail-open true，不擋註冊', async () => {
    vi.mocked(resolveMx).mockRejectedValue(new Error('ENOTFOUND'))
    expect(await hasValidMxRecord('test@nonexistent-domain-xyz.invalid')).toBe(true)
  })

  it('格式異常（無 @）→ fail-open true', async () => {
    expect(await hasValidMxRecord('not-an-email')).toBe(true)
  })
})
