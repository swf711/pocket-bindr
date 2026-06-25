import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('RESET_TOKEN_SECRET', 'test-reset-secret-32-chars-enough!')

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => '$2b$12$newhash'),
    compare: vi.fn(),
  },
}))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import { createResetToken } from '@/lib/reset-password'
import bcrypt from 'bcryptjs'

const MOCK_HASH = '$2b$12$abc123xyz456abcdef01234567890123456789012345678901234'
const MOCK_USER = { id: 'u1', email: 'test@example.com', passwordHash: MOCK_HASH }

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.user.update).mockResolvedValue(MOCK_USER as never)
  })

  it('有效 token + 合格密碼 → 200 success，DB 更新', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: MOCK_HASH } as never)
    const token = createResetToken(MOCK_USER.id, MOCK_USER.email, MOCK_HASH)

    const res = await POST(makeRequest({ token, newPassword: 'newpassword123' }))
    const data = await res.json() as { success: boolean }

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: MOCK_USER.id },
      data: { passwordHash: '$2b$12$newhash' },
    })
  })

  it('token 過期 → 400 TOKEN_EXPIRED', async () => {
    vi.useFakeTimers()
    const token = createResetToken(MOCK_USER.id, MOCK_USER.email, MOCK_HASH)
    vi.advanceTimersByTime(16 * 60 * 1000)

    const res = await POST(makeRequest({ token, newPassword: 'newpassword123' }))
    const data = await res.json() as { error: string }

    expect(res.status).toBe(400)
    expect(data.error).toBe('TOKEN_EXPIRED')
    vi.useRealTimers()
  })

  it('token 簽名錯誤 → 400 TOKEN_INVALID', async () => {
    const res = await POST(makeRequest({ token: 'bad.token', newPassword: 'newpassword123' }))
    const data = await res.json() as { error: string }

    expect(res.status).toBe(400)
    expect(data.error).toBe('TOKEN_INVALID')
  })

  it('pwHashPrefix 不符（token 已用過） → 400 TOKEN_INVALID', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: '$2b$12$DIFFERENT' } as never)
    const token = createResetToken(MOCK_USER.id, MOCK_USER.email, MOCK_HASH)

    const res = await POST(makeRequest({ token, newPassword: 'newpassword123' }))
    const data = await res.json() as { error: string }

    expect(res.status).toBe(400)
    expect(data.error).toBe('TOKEN_INVALID')
  })

  it('新密碼少於 8 字元 → 400 INVALID_NEW_PASSWORD', async () => {
    const token = createResetToken(MOCK_USER.id, MOCK_USER.email, MOCK_HASH)

    const res = await POST(makeRequest({ token, newPassword: 'short' }))
    const data = await res.json() as { error: string }

    expect(res.status).toBe(400)
    expect(data.error).toBe('INVALID_NEW_PASSWORD')
  })

  it('user 不存在（userId 已刪） → 400 TOKEN_INVALID', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const token = createResetToken(MOCK_USER.id, MOCK_USER.email, MOCK_HASH)

    const res = await POST(makeRequest({ token, newPassword: 'newpassword123' }))
    const data = await res.json() as { error: string }

    expect(res.status).toBe(400)
    expect(data.error).toBe('TOKEN_INVALID')
  })

  it('token 缺失 → 400 TOKEN_INVALID', async () => {
    const res = await POST(makeRequest({ newPassword: 'newpassword123' }))
    const data = await res.json() as { error: string }

    expect(res.status).toBe(400)
    expect(data.error).toBe('TOKEN_INVALID')
  })
})
