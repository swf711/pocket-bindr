import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth-utils', () => ({ registerUser: vi.fn() }))

import { POST } from '../route'
import { registerUser } from '@/lib/auth-utils'

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

  it('成功回 201', async () => {
    vi.mocked(registerUser).mockResolvedValue({ success: true, userId: 'user-1' })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
    expect((await res.json()).success).toBe(true)
  })
})
