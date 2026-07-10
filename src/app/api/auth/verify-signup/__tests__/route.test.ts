import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFindUnique = vi.fn()
const mockUpdate = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

const mockVerifyEmailVerifyToken = vi.fn()
vi.mock('@/lib/email-verify-token', () => ({
  verifyEmailVerifyToken: (...args: unknown[]) => mockVerifyEmailVerifyToken(...args),
}))

vi.mock('@/lib/rate-limit', () => ({
  signupVerifyIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}))

import { POST } from '../route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/verify-signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_PAYLOAD = {
  userId: 'user-1',
  email: 'new@example.com',
  purpose: 'verify-signup',
  exp: Date.now() + 900000,
}

describe('POST /api/auth/verify-signup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('免登入亦可成功（無 session 概念，路由本身不查 auth()）', async () => {
    mockVerifyEmailVerifyToken.mockReturnValue(VALID_PAYLOAD)
    mockFindUnique.mockResolvedValue({ email: VALID_PAYLOAD.email, emailVerified: null })
    const res = await POST(makeRequest({ token: 'valid.token' }))
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: VALID_PAYLOAD.userId },
      data: { emailVerified: expect.any(Date) },
    })
  })

  it('token 過期回傳 400 TOKEN_EXPIRED', async () => {
    mockVerifyEmailVerifyToken.mockImplementation(() => {
      throw new Error('TOKEN_EXPIRED')
    })
    const res = await POST(makeRequest({ token: 'expired.token' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('TOKEN_EXPIRED')
  })

  it('token 無效回傳 400 TOKEN_INVALID', async () => {
    mockVerifyEmailVerifyToken.mockImplementation(() => {
      throw new Error('TOKEN_INVALID')
    })
    const res = await POST(makeRequest({ token: 'bad.token' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('TOKEN_INVALID')
  })

  it('token 缺失回傳 400 TOKEN_INVALID 且不查 DB', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('TOKEN_INVALID')
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('user 不存在或 email 已不符 payload → 400 TOKEN_INVALID', async () => {
    mockVerifyEmailVerifyToken.mockReturnValue(VALID_PAYLOAD)
    mockFindUnique.mockResolvedValue(null)
    const res = await POST(makeRequest({ token: 'valid.token' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('TOKEN_INVALID')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('emailVerified 已非 null（重放）→ 409 ALREADY_VERIFIED，no-op', async () => {
    mockVerifyEmailVerifyToken.mockReturnValue(VALID_PAYLOAD)
    mockFindUnique.mockResolvedValue({ email: VALID_PAYLOAD.email, emailVerified: new Date() })
    const res = await POST(makeRequest({ token: 'valid.token' }))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('ALREADY_VERIFIED')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('rate limit 超限回傳 429', async () => {
    const { signupVerifyIpLimiter } = await import('@/lib/rate-limit')
    vi.mocked(signupVerifyIpLimiter.limit).mockResolvedValueOnce({ success: false } as never)
    const res = await POST(makeRequest({ token: 'valid.token' }))
    expect(res.status).toBe(429)
  })
})
