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

const mockSendReportEmail = vi.fn()
vi.mock('@/lib/email', () => ({
  sendReportEmail: (...args: unknown[]) => mockSendReportEmail(...args),
}))

vi.mock('@/lib/rate-limit', () => ({
  reportIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  reportUserLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import { reportIpLimiter, reportUserLimiter } from '@/lib/rate-limit'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = { type: 'bug', message: 'A sufficiently long bug description.' }

describe('POST /api/report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(reportIpLimiter.limit).mockResolvedValue({ success: true } as never)
    vi.mocked(reportUserLimiter.limit).mockResolvedValue({ success: true } as never)
    mockSendReportEmail.mockResolvedValue(undefined)
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('IP rate limit 超限回傳 429', async () => {
    vi.mocked(reportIpLimiter.limit).mockResolvedValue({ success: false } as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error).toBe('RATE_LIMITED')
  })

  it('user rate limit 超限回傳 429', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(reportUserLimiter.limit).mockResolvedValue({ success: false } as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error).toBe('RATE_LIMITED')
  })

  it('body 不合法回傳 400 對應 code', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await POST(makeRequest({ type: 'bug', message: 'short' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('REPORT_MESSAGE_TOO_SHORT')
  })

  it('成功回傳 200 並以 session 使用者資訊呼叫 sendReportEmail', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'a@b.com',
      username: 'brian',
    } as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(mockSendReportEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterEmail: 'a@b.com',
        reporterId: 'user-1',
        username: 'brian',
        type: 'bug',
        message: validBody.message,
      }),
    )
  })

  it('寄信失敗回傳 500 SEND_FAILED', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: 'a@b.com', username: 'brian' } as never)
    mockSendReportEmail.mockRejectedValue(new Error('resend down'))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('SEND_FAILED')
  })
})
