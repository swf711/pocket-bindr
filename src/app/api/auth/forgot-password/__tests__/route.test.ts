import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('RESET_TOKEN_SECRET', 'test-reset-secret-32-chars-enough!')
vi.stubEnv('AUTH_URL', 'http://localhost:3000')
vi.stubEnv('RESEND_API_KEY', 'test')

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}))

const mockIpLimit = vi.fn()
const mockEmailLimit = vi.fn()
vi.mock('@/lib/rate-limit', () => ({
  forgotPasswordIpLimiter: { limit: () => mockIpLimit() },
  forgotPasswordEmailLimiter: { limit: () => mockEmailLimit() },
}))

const mockSendEmail = vi.fn()
vi.mock('@/lib/email', () => ({
  sendResetPasswordEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'

const SUCCESS_MESSAGE = '若此 email 有帳號，您將在幾分鐘內收到重設信'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIpLimit.mockResolvedValue({ success: true })
    mockEmailLimit.mockResolvedValue({ success: true })
  })

  it('email 存在且有 passwordHash → 200 成功訊息，呼叫 sendResetPasswordEmail', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      passwordHash: '$2b$12$abc123',
      username: 'testuser',
    } as never)
    mockSendEmail.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ email: 'test@example.com' }))
    const data = await res.json() as { message: string }

    expect(res.status).toBe(200)
    expect(data.message).toBe(SUCCESS_MESSAGE)
    expect(mockSendEmail).toHaveBeenCalledOnce()
    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String),
      'testuser',
    )
  })

  it('email 不存在 → 200 相同訊息，不呼叫 sendResetPasswordEmail', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await POST(makeRequest({ email: 'nobody@example.com' }))
    const data = await res.json() as { message: string }

    expect(res.status).toBe(200)
    expect(data.message).toBe(SUCCESS_MESSAGE)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('email 存在但無 passwordHash（純 OAuth） → 200 相同訊息，不寄信', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u2',
      email: 'oauth@example.com',
      passwordHash: null,
      username: null,
    } as never)

    const res = await POST(makeRequest({ email: 'oauth@example.com' }))
    const data = await res.json() as { message: string }

    expect(res.status).toBe(200)
    expect(data.message).toBe(SUCCESS_MESSAGE)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('IP rate limit 超限 → 429', async () => {
    mockIpLimit.mockResolvedValue({ success: false })

    const res = await POST(makeRequest({ email: 'test@example.com' }))
    const data = await res.json() as { error: string }

    expect(res.status).toBe(429)
    expect(data.error).toBe('RATE_LIMITED')
  })

  it('email rate limit 超限 → 429', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    mockEmailLimit.mockResolvedValue({ success: false })

    const res = await POST(makeRequest({ email: 'test@example.com' }))
    const data = await res.json() as { error: string }

    expect(res.status).toBe(429)
    expect(data.error).toBe('RATE_LIMITED')
  })

  it('sendResetPasswordEmail 拋錯 → 500', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      passwordHash: '$2b$12$abc123',
      username: null,
    } as never)
    mockSendEmail.mockRejectedValue(new Error('Resend error'))

    const res = await POST(makeRequest({ email: 'test@example.com' }))
    expect(res.status).toBe(500)
  })
})
