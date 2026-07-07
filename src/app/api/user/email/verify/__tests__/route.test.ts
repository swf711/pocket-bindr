import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockTransaction = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => unknown) => mockTransaction(fn),
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

const mockVerifyEmailVerifyToken = vi.fn()
vi.mock('@/lib/email-verify-token', () => ({
  verifyEmailVerifyToken: (...args: unknown[]) => mockVerifyEmailVerifyToken(...args),
}))

vi.mock('@/lib/rate-limit', () => ({
  emailVerifyIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}))

import { POST } from '../route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/user/email/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_PAYLOAD = { userId: 'user-1', email: 'new@example.com', purpose: 'verify-email', exp: Date.now() + 900000 }

describe('POST /api/user/email/verify', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ token: 'sometoken' }))
    expect(res.status).toBe(401)
  })

  it('token 型別不是字串回傳 400 TOKEN_INVALID', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await POST(makeRequest({ token: 12345 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('TOKEN_INVALID')
  })

  it('token 驗證失敗（過期）回傳 400 TOKEN_EXPIRED', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockVerifyEmailVerifyToken.mockImplementation(() => {
      throw new Error('TOKEN_EXPIRED')
    })
    const res = await POST(makeRequest({ token: 'expired.token' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('TOKEN_EXPIRED')
  })

  it('token 驗證失敗（無效）回傳 400 TOKEN_INVALID', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockVerifyEmailVerifyToken.mockImplementation(() => {
      throw new Error('TOKEN_INVALID')
    })
    const res = await POST(makeRequest({ token: 'bad.token' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('TOKEN_INVALID')
  })

  it('session userId 與 token 內 userId 不符 → 403 FORBIDDEN（D5 深度防禦）', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'someone-else' } })
    mockVerifyEmailVerifyToken.mockReturnValue(VALID_PAYLOAD)
    const res = await POST(makeRequest({ token: 'valid.token' }))
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('FORBIDDEN')
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('transaction 內查得 email 已被他人使用 → 409 EMAIL_ALREADY_USED（陷阱 A 第二次查重）', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockVerifyEmailVerifyToken.mockReturnValue(VALID_PAYLOAD)
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        user: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({ email: null }),
          findUnique: vi.fn().mockResolvedValue({ id: 'other-user' }),
          update: vi.fn(),
        },
      }),
    )
    const res = await POST(makeRequest({ token: 'valid.token' }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('EMAIL_ALREADY_USED')
  })

  it('本人已非 null（重放攻擊）→ 409 EMAIL_ALREADY_SET（D3 防重放）', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockVerifyEmailVerifyToken.mockReturnValue(VALID_PAYLOAD)
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        user: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({ email: 'already@example.com' }),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
      }),
    )
    const res = await POST(makeRequest({ token: 'valid.token' }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('EMAIL_ALREADY_SET')
  })

  it('P2002 並發衝突 → 409 EMAIL_ALREADY_USED', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockVerifyEmailVerifyToken.mockReturnValue(VALID_PAYLOAD)
    mockTransaction.mockImplementation(() => {
      const err = new Error('Unique constraint failed') as Error & { code: string }
      err.code = 'P2002'
      throw err
    })
    const res = await POST(makeRequest({ token: 'valid.token' }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('EMAIL_ALREADY_USED')
  })

  it('成功寫入 email + emailVerified，回傳 200（D7）', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockVerifyEmailVerifyToken.mockReturnValue(VALID_PAYLOAD)
    const updateMock = vi.fn()
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        user: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({ email: null }),
          findUnique: vi.fn().mockResolvedValue(null),
          update: updateMock,
        },
      }),
    )
    const res = await POST(makeRequest({ token: 'valid.token' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { email: 'new@example.com', emailVerified: expect.any(Date) },
    })
  })
})
