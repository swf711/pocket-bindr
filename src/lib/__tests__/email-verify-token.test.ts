import { describe, it, expect, vi } from 'vitest'
import { createHmac } from 'crypto'

vi.stubEnv('EMAIL_VERIFY_SECRET', 'test-email-verify-secret-32-chars!')
vi.stubEnv('RESET_TOKEN_SECRET', 'test-reset-secret-should-be-unused!')

import { createEmailVerifyToken, verifyEmailVerifyToken } from '../email-verify-token'

const MOCK_USER_ID = 'user-abc-123'
const MOCK_EMAIL = 'test@example.com'

describe('createEmailVerifyToken / verifyEmailVerifyToken', () => {
  it('正常 token 可解析出正確 payload', () => {
    const token = createEmailVerifyToken(MOCK_USER_ID, MOCK_EMAIL)
    const payload = verifyEmailVerifyToken(token)
    expect(payload.userId).toBe(MOCK_USER_ID)
    expect(payload.email).toBe(MOCK_EMAIL)
    expect(payload.purpose).toBe('verify-email')
    expect(payload.exp).toBeGreaterThan(Date.now())
  })

  it('token exp 大約是 15 分鐘後', () => {
    const before = Date.now()
    const token = createEmailVerifyToken(MOCK_USER_ID, MOCK_EMAIL)
    const payload = verifyEmailVerifyToken(token)
    const expectedExp = before + 15 * 60 * 1000
    expect(payload.exp).toBeGreaterThanOrEqual(expectedExp - 100)
    expect(payload.exp).toBeLessThanOrEqual(expectedExp + 100)
  })

  it('簽名被篡改 → throws TOKEN_INVALID', () => {
    const token = createEmailVerifyToken(MOCK_USER_ID, MOCK_EMAIL)
    const tampered = token.slice(0, -5) + 'xxxxx'
    expect(() => verifyEmailVerifyToken(tampered)).toThrow('TOKEN_INVALID')
  })

  it('payload 內 email 被篡改（簽名對不上） → throws TOKEN_INVALID', () => {
    // 陷阱 B：即使 payload 格式正確，換掉 email 而簽名不變會被 HMAC 驗章擋下。
    const fakePayload = Buffer.from(JSON.stringify({
      userId: MOCK_USER_ID,
      email: 'attacker@example.com',
      purpose: 'verify-email',
      exp: Date.now() + 99999999,
    })).toString('base64url')
    const fakeToken = `${fakePayload}.invalidsig`
    expect(() => verifyEmailVerifyToken(fakeToken)).toThrow('TOKEN_INVALID')
  })

  it('purpose 不是 verify-email → throws TOKEN_INVALID', () => {
    // 模擬用其他用途簽的 token（若未來有其他 purpose）被誤用於此流程。
    const payload = { userId: MOCK_USER_ID, email: MOCK_EMAIL, purpose: 'other', exp: Date.now() + 900000 }
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const sig = createHmac('sha256', process.env.EMAIL_VERIFY_SECRET!).update(data).digest('hex')
    expect(() => verifyEmailVerifyToken(`${data}.${sig}`)).toThrow('TOKEN_INVALID')
  })

  it('token 缺少 dot 分隔 → throws TOKEN_INVALID', () => {
    expect(() => verifyEmailVerifyToken('invalidtoken')).toThrow('TOKEN_INVALID')
  })

  it('exp 已過期 → throws TOKEN_EXPIRED', () => {
    vi.useFakeTimers()
    const token = createEmailVerifyToken(MOCK_USER_ID, MOCK_EMAIL)
    vi.advanceTimersByTime(16 * 60 * 1000)
    expect(() => verifyEmailVerifyToken(token)).toThrow('TOKEN_EXPIRED')
    vi.useRealTimers()
  })

  it('不使用 RESET_TOKEN_SECRET（職責分離）', () => {
    vi.stubEnv('EMAIL_VERIFY_SECRET', 'secret-A')
    const token = createEmailVerifyToken(MOCK_USER_ID, MOCK_EMAIL)

    vi.stubEnv('EMAIL_VERIFY_SECRET', 'secret-B')
    expect(() => verifyEmailVerifyToken(token)).toThrow('TOKEN_INVALID')

    vi.stubEnv('EMAIL_VERIFY_SECRET', 'secret-A')
    expect(() => verifyEmailVerifyToken(token)).not.toThrow()
  })
})
