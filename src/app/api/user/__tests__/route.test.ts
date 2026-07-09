import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDeleteUser = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      delete: (args: unknown) => mockDeleteUser(args),
    },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

const mockDeleteAvatar = vi.fn()
vi.mock('@/lib/avatar-storage', () => ({
  deleteAvatar: (userId: string) => mockDeleteAvatar(userId),
}))

import { DELETE } from '../route'

describe('DELETE /api/user', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost/api/user', { method: 'DELETE' }))
    expect(res.status).toBe(401)
  })

  it('成功刪除：prisma.user.delete 以 session userId 呼叫，回傳 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-42' } })
    mockDeleteUser.mockResolvedValue({ id: 'user-42' })

    const res = await DELETE(new Request('http://localhost/api/user', { method: 'DELETE' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    // 確認 userId 只來自 session，而非外部輸入
    expect(mockDeleteUser).toHaveBeenCalledWith({ where: { id: 'user-42' } })
    // DB 刪除後接著清除 Supabase Storage 頭像
    expect(mockDeleteAvatar).toHaveBeenCalledWith('user-42')
  })
})
