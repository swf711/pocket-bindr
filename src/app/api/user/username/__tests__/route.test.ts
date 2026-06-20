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

import { PATCH } from '../route'
import { prisma } from '@/lib/prisma'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/user/username', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/user/username', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ username: 'newname' }))
    expect(res.status).toBe(401)
  })

  it('username 少於 3 字元回傳 400 INVALID_USERNAME', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await PATCH(makeRequest({ username: 'ab' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('INVALID_USERNAME')
  })

  it('username 超過 20 字元回傳 400 INVALID_USERNAME', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await PATCH(makeRequest({ username: 'a'.repeat(21) }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('INVALID_USERNAME')
  })

  it('username 含空格回傳 400 INVALID_USERNAME', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await PATCH(makeRequest({ username: 'hello world' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('INVALID_USERNAME')
  })

  it('username 已被其他用戶使用回傳 409 USERNAME_TAKEN', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-2' } as never)
    const res = await PATCH(makeRequest({ username: 'taken_name' }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('USERNAME_TAKEN')
  })

  it('username 與自己相同（重設同名）回傳 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
    const res = await PATCH(makeRequest({ username: 'myname' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('合法 username 更新成功回傳 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
    const res = await PATCH(makeRequest({ username: 'valid_name' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('Prisma P2002 錯誤被捕捉並回傳 409 USERNAME_TAKEN', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.update).mockRejectedValue(
      Object.assign(new Error('Unique constraint'), { code: 'P2002' })
    )
    const res = await PATCH(makeRequest({ username: 'race_case' }))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('USERNAME_TAKEN')
  })
})
