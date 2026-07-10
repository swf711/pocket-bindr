import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFindUnique = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

const mockCreateEmailVerifyToken = vi.fn().mockReturnValue('mock-token')
vi.mock('@/lib/email-verify-token', () => ({
  createEmailVerifyToken: (...args: unknown[]) => mockCreateEmailVerifyToken(...args),
}))

const mockSendSignupVerificationEmail = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/email', () => ({
  sendSignupVerificationEmail: (...args: unknown[]) => mockSendSignupVerificationEmail(...args),
}))

vi.mock('@/lib/rate-limit', () => ({
  resendVerificationIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  resendVerificationEmailLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}))

import { POST } from '../route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('不存在的 email → 200 且不寄信（防 enumeration）', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await POST(makeRequest({ email: 'nobody@example.com' }))
    expect(res.status).toBe(200)
    expect(mockSendSignupVerificationEmail).not.toHaveBeenCalled()
  })

  it('已驗證帳號 → 200 但不寄信', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      username: 'user1',
      passwordHash: 'hash',
      emailVerified: new Date(),
    })
    const res = await POST(makeRequest({ email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(mockSendSignupVerificationEmail).not.toHaveBeenCalled()
  })

  it('純 OAuth（passwordHash 為 null）→ 200 但不寄信', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      username: 'user1',
      passwordHash: null,
      emailVerified: null,
    })
    const res = await POST(makeRequest({ email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(mockSendSignupVerificationEmail).not.toHaveBeenCalled()
  })

  it('未驗證的 credentials 帳號 → 200 且實際寄信', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      username: 'user1',
      passwordHash: 'hash',
      emailVerified: null,
    })
    const res = await POST(makeRequest({ email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(mockCreateEmailVerifyToken).toHaveBeenCalledWith('user-1', 'a@b.com', 'verify-signup')
    expect(mockSendSignupVerificationEmail).toHaveBeenCalledWith('a@b.com', 'mock-token', 'user1')
  })

  it('缺少 email → 200 且不查 DB', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('超限回傳 429', async () => {
    const { resendVerificationIpLimiter } = await import('@/lib/rate-limit')
    vi.mocked(resendVerificationIpLimiter.limit).mockResolvedValueOnce({ success: false } as never)
    const res = await POST(makeRequest({ email: 'a@b.com' }))
    expect(res.status).toBe(429)
  })
})
