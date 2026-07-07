import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

const mockCreateEmailVerifyToken = vi.fn()
vi.mock('@/lib/email-verify-token', () => ({
  createEmailVerifyToken: (...args: unknown[]) => mockCreateEmailVerifyToken(...args),
}))

const mockSendEmailVerification = vi.fn()
vi.mock('@/lib/email', () => ({
  sendEmailVerification: (...args: unknown[]) => mockSendEmailVerification(...args),
}))

vi.mock('@/lib/rate-limit', () => ({
  emailRequestIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  emailRequestUserLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/user/email/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/user/email/request', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ email: 'new@example.com' }))
    expect(res.status).toBe(401)
  })

  it('email 格式錯誤回傳 400 INVALID_EMAIL', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await POST(makeRequest({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('INVALID_EMAIL')
  })

  it('本人已有 email 回傳 409 EMAIL_ALREADY_SET', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      email: 'existing@example.com',
      username: 'me',
    } as never)
    const res = await POST(makeRequest({ email: 'new@example.com' }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('EMAIL_ALREADY_SET')
  })

  it('email 已被他人使用回傳 409 EMAIL_ALREADY_USED', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ email: null, username: 'me' } as never) // self lookup
      .mockResolvedValueOnce({ id: 'other-user' } as never) // duplicate lookup
    const res = await POST(makeRequest({ email: 'taken@example.com' }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('EMAIL_ALREADY_USED')
  })

  it('成功時簽發 token 並寄出驗證信', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ email: null, username: 'me' } as never) // self lookup
      .mockResolvedValueOnce(null as never) // no duplicate
    mockCreateEmailVerifyToken.mockReturnValue('signed.token')

    const res = await POST(makeRequest({ email: 'new@example.com' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(mockCreateEmailVerifyToken).toHaveBeenCalledWith('user-1', 'new@example.com')
    expect(mockSendEmailVerification).toHaveBeenCalledWith('new@example.com', 'signed.token', 'me')
  })
})
