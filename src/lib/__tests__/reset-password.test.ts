import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('RESET_TOKEN_SECRET', 'test-reset-secret-32-chars-enough!')
vi.stubEnv('LINK_STATE_SECRET', 'test-link-secret-should-be-unused!')

import { createResetToken, verifyResetToken } from '../reset-password'

const MOCK_USER_ID = 'user-abc-123'
const MOCK_EMAIL = 'test@example.com'
const MOCK_HASH = '$2b$12$abc123xyz456abcdef01234567890123456789012345678901234'

describe('createResetToken / verifyResetToken', () => {
  it('正常 token 可解析出正確 payload', () => {
    const token = createResetToken(MOCK_USER_ID, MOCK_EMAIL, MOCK_HASH)
    const payload = verifyResetToken(token)
    expect(payload.userId).toBe(MOCK_USER_ID)
    expect(payload.email).toBe(MOCK_EMAIL)
    expect(payload.pwHashPrefix).toBe(MOCK_HASH.slice(0, 8))
    expect(payload.exp).toBeGreaterThan(Date.now())
  })

  it('token exp 大約是 15 分鐘後', () => {
    const before = Date.now()
    const token = createResetToken(MOCK_USER_ID, MOCK_EMAIL, MOCK_HASH)
    const payload = verifyResetToken(token)
    const expectedExp = before + 15 * 60 * 1000
    expect(payload.exp).toBeGreaterThanOrEqual(expectedExp - 100)
    expect(payload.exp).toBeLessThanOrEqual(expectedExp + 100)
  })

  it('簽名被篡改 → throws TOKEN_INVALID', () => {
    const token = createResetToken(MOCK_USER_ID, MOCK_EMAIL, MOCK_HASH)
    const tampered = token.slice(0, -5) + 'xxxxx'
    expect(() => verifyResetToken(tampered)).toThrow('TOKEN_INVALID')
  })

  it('payload 被篡改（但格式正確） → throws TOKEN_INVALID', () => {
    const fakePayload = Buffer.from(JSON.stringify({
      userId: 'hacker',
      email: MOCK_EMAIL,
      pwHashPrefix: MOCK_HASH.slice(0, 8),
      exp: Date.now() + 99999999,
    })).toString('base64url')
    const fakeToken = `${fakePayload}.invalidsig`
    expect(() => verifyResetToken(fakeToken)).toThrow('TOKEN_INVALID')
  })

  it('token 缺少 dot 分隔 → throws TOKEN_INVALID', () => {
    expect(() => verifyResetToken('invalidtoken')).toThrow('TOKEN_INVALID')
  })

  it('exp 已過期 → throws TOKEN_EXPIRED', () => {
    vi.useFakeTimers()
    const token = createResetToken(MOCK_USER_ID, MOCK_EMAIL, MOCK_HASH)
    vi.advanceTimersByTime(16 * 60 * 1000)
    expect(() => verifyResetToken(token)).toThrow('TOKEN_EXPIRED')
    vi.useRealTimers()
  })

  it('不使用 LINK_STATE_SECRET（職責分離）', () => {
    vi.stubEnv('RESET_TOKEN_SECRET', 'secret-A')
    const token = createResetToken(MOCK_USER_ID, MOCK_EMAIL, MOCK_HASH)

    vi.stubEnv('RESET_TOKEN_SECRET', 'secret-B')
    expect(() => verifyResetToken(token)).toThrow('TOKEN_INVALID')

    vi.stubEnv('RESET_TOKEN_SECRET', 'secret-A')
    expect(() => verifyResetToken(token)).not.toThrow()
  })
})
