import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSend = vi.fn()
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend }
  },
}))

import { sendReportEmail } from '@/lib/email'

describe('sendReportEmail', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('RESEND_API_KEY=test 時跳過寄信', async () => {
    process.env.RESEND_API_KEY = 'test'
    await sendReportEmail({
      reporterEmail: 'a@b.com',
      reporterId: 'user-1',
      username: 'brian',
      type: 'bug',
      message: 'hello',
    })
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('缺少 REPORT_TO_EMAIL 時 throw', async () => {
    process.env.RESEND_API_KEY = 'real-key'
    delete process.env.REPORT_TO_EMAIL
    await expect(
      sendReportEmail({
        reporterEmail: 'a@b.com',
        reporterId: 'user-1',
        username: 'brian',
        type: 'bug',
        message: 'hello',
      }),
    ).rejects.toThrow('REPORT_TO_EMAIL')
  })

  it('有 REPORT_TO_EMAIL 時以該收件人寄信', async () => {
    process.env.RESEND_API_KEY = 'real-key'
    process.env.REPORT_TO_EMAIL = 'owner@example.com'
    mockSend.mockResolvedValue({ error: null })
    await sendReportEmail({
      reporterEmail: 'a@b.com',
      reporterId: 'user-1',
      username: 'brian',
      type: 'bug',
      message: 'hello',
    })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'owner@example.com' }),
    )
  })

  it('attachments 轉為 Resend attachments 格式', async () => {
    process.env.RESEND_API_KEY = 'real-key'
    process.env.REPORT_TO_EMAIL = 'owner@example.com'
    mockSend.mockResolvedValue({ error: null })
    await sendReportEmail({
      reporterEmail: 'a@b.com',
      reporterId: 'user-1',
      username: 'brian',
      type: 'bug',
      message: 'hello',
      attachments: [{ filename: 'a.webp', content: 'base64data', contentType: 'image/webp' }],
    })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [{ filename: 'a.webp', content: 'base64data', contentType: 'image/webp' }],
      }),
    )
  })
})
