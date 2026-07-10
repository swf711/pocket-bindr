import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth-utils', () => ({ registerUser: vi.fn() }))

vi.mock('@/lib/rate-limit', () => ({
  registerIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  registerEmailLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}))

vi.mock('@/lib/email-precheck', () => ({
  isDisposableEmailDomain: vi.fn().mockReturnValue(false),
  hasValidMxRecord: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/email-verify-token', () => ({
  createEmailVerifyToken: vi.fn().mockReturnValue('mock-token'),
}))

vi.mock('@/lib/email', () => ({
  sendSignupVerificationEmail: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '../route'
import { registerUser } from '@/lib/auth-utils'
import { isDisposableEmailDomain, hasValidMxRecord } from '@/lib/email-precheck'
import { createEmailVerifyToken } from '@/lib/email-verify-token'
import { sendSignupVerificationEmail } from '@/lib/email'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = { email: 'a@b.com', username: 'user1', password: 'password123' }

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('缺少欄位回 400 INVALID_INPUT 且不呼叫 registerUser', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', username: 'user1' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('INVALID_INPUT')
    expect(registerUser).not.toHaveBeenCalled()
  })

  it('密碼過短回 400 WEAK_PASSWORD', async () => {
    vi.mocked(registerUser).mockResolvedValue({ success: false, error: 'WEAK_PASSWORD' })
    const res = await POST(makeRequest({ ...validBody, password: 'short' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('WEAK_PASSWORD')
  })

  it('email 已被使用回 409 EMAIL_TAKEN', async () => {
    vi.mocked(registerUser).mockResolvedValue({ success: false, error: 'EMAIL_TAKEN' })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('EMAIL_TAKEN')
  })

  it('username 已被使用回 409 USERNAME_TAKEN', async () => {
    vi.mocked(registerUser).mockResolvedValue({ success: false, error: 'USERNAME_TAKEN' })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('USERNAME_TAKEN')
  })

  it('成功回 201 且寄出 verify-signup 驗證信', async () => {
    vi.mocked(registerUser).mockResolvedValue({ success: true, userId: 'user-1' })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
    expect((await res.json()).success).toBe(true)
    expect(createEmailVerifyToken).toHaveBeenCalledWith('user-1', validBody.email, 'verify-signup')
    expect(sendSignupVerificationEmail).toHaveBeenCalledWith(validBody.email, 'mock-token', validBody.username)
  })

  it('拋棄式信箱網域回 400 DISPOSABLE_EMAIL 且不呼叫 registerUser（D7）', async () => {
    vi.mocked(isDisposableEmailDomain).mockReturnValueOnce(true)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('DISPOSABLE_EMAIL')
    expect(registerUser).not.toHaveBeenCalled()
  })

  it('MX record 查無 → 400 INVALID_EMAIL_DOMAIN 且不呼叫 registerUser（D7）', async () => {
    vi.mocked(hasValidMxRecord).mockResolvedValueOnce(false)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('INVALID_EMAIL_DOMAIN')
    expect(registerUser).not.toHaveBeenCalled()
  })
})
