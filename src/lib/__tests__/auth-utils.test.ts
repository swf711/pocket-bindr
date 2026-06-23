import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}))

import { registerUser, verifyCredentials } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const mockUser = {
  id: 'user-123',
  email: 'test@test.com',
  username: 'testuser',
  passwordHash: 'hashed_password',
  emailVerified: null,
  image: null,
  provider: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('registerUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('成功建立新使用者', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

    const result = await registerUser({
      email: 'test@test.com',
      username: 'testuser',
      password: 'password123',
    })

    expect(result.success).toBe(true)
    expect(result.userId).toBe('user-123')
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)
  })

  it('密碼少於 8 字回傳 WEAK_PASSWORD 且不查 DB / 不建立使用者', async () => {
    const result = await registerUser({
      email: 'new@test.com',
      username: 'newuser',
      password: 'short',
    })

    expect(result).toEqual({ success: false, error: 'WEAK_PASSWORD' })
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('email 已被使用時回傳 EMAIL_TAKEN', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)

    const result = await registerUser({
      email: 'taken@test.com',
      username: 'newuser',
      password: 'password123',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('EMAIL_TAKEN')
  })

  it('username 已被使用時回傳 USERNAME_TAKEN', async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockUser)

    const result = await registerUser({
      email: 'new@test.com',
      username: 'takenuser',
      password: 'password123',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('USERNAME_TAKEN')
  })
})

describe('verifyCredentials', () => {
  beforeEach(() => vi.clearAllMocks())

  it('正確的 email + password 回傳 user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

    const result = await verifyCredentials({
      email: 'test@test.com',
      password: 'password123',
    })

    expect(result).not.toBeNull()
    expect(result?.id).toBe('user-123')
  })

  it('找不到 email 時回傳 null', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await verifyCredentials({
      email: 'notfound@test.com',
      password: 'password123',
    })

    expect(result).toBeNull()
  })

  it('密碼錯誤時回傳 null', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const result = await verifyCredentials({
      email: 'test@test.com',
      password: 'wrongpassword',
    })

    expect(result).toBeNull()
  })
})
