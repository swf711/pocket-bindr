import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  passwordChangeIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  passwordChangeUserLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  passwordSetIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  passwordSetUserLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}))

import { PATCH, POST } from '../route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function makeRequest(body: unknown, method = 'PATCH') {
  return new NextRequest('http://localhost/api/user/password', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makePostRequest(body: unknown) {
  return makeRequest(body, 'POST')
}

describe('PATCH /api/user/password', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ currentPassword: 'old', newPassword: 'newpass1' }))
    expect(res.status).toBe(401)
  })

  it('newPassword 少於 8 字元回傳 400 INVALID_NEW_PASSWORD', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await PATCH(makeRequest({ currentPassword: 'old', newPassword: 'short' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('INVALID_NEW_PASSWORD')
  })

  it('無 passwordHash（純 Google 帳號）回傳 400 NO_PASSWORD_SET', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: null } as never)
    const res = await PATCH(makeRequest({ currentPassword: 'old', newPassword: 'newpassword1' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('NO_PASSWORD_SET')
  })

  it('currentPassword 錯誤回傳 401 WRONG_PASSWORD', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: 'hashed' } as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)
    const res = await PATCH(makeRequest({ currentPassword: 'wrongpass', newPassword: 'newpassword1' }))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('WRONG_PASSWORD')
  })

  it('正確密碼成功更新回傳 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ passwordHash: 'hashed' } as never)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(bcrypt.hash).mockResolvedValue('newhash' as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
    const res = await PATCH(makeRequest({ currentPassword: 'correctpass', newPassword: 'newpassword1' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'newhash' },
    })
  })
})

describe('POST /api/user/password', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makePostRequest({ newPassword: 'newpass1' }))
    expect(res.status).toBe(401)
  })

  it('newPassword 少於 8 字元回傳 400 INVALID_NEW_PASSWORD', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await POST(makePostRequest({ newPassword: 'short' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('INVALID_NEW_PASSWORD')
  })

  it('newPassword 非字串回傳 400 INVALID_NEW_PASSWORD', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await POST(makePostRequest({ newPassword: 12345678 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('INVALID_NEW_PASSWORD')
  })

  it('user.email 為 null 回傳 400 EMAIL_REQUIRED', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      passwordHash: null,
      email: null,
    } as never)
    const res = await POST(makePostRequest({ newPassword: 'newpassword1' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('EMAIL_REQUIRED')
  })

  it('user 已有 passwordHash 回傳 409 PASSWORD_ALREADY_SET', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      passwordHash: 'hashed',
      email: 'a@b.com',
    } as never)
    const res = await POST(makePostRequest({ newPassword: 'newpassword1' }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('PASSWORD_ALREADY_SET')
  })

  it('純 OAuth 使用者成功設定密碼回傳 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      passwordHash: null,
      email: 'a@b.com',
    } as never)
    vi.mocked(bcrypt.hash).mockResolvedValue('newhash' as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
    const res = await POST(makePostRequest({ newPassword: 'newpassword1' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword1', 12)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'newhash' },
    })
  })
})
