import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

const mockEnsureAvatarBucket = vi.fn()
const mockUploadAvatar = vi.fn()
const mockDeleteAvatar = vi.fn()
vi.mock('@/lib/avatar-storage', () => ({
  ensureAvatarBucket: (...args: unknown[]) => mockEnsureAvatarBucket(...args),
  uploadAvatar: (...args: unknown[]) => mockUploadAvatar(...args),
  deleteAvatar: (...args: unknown[]) => mockDeleteAvatar(...args),
}))

import { POST, DELETE } from '../route'
import { prisma } from '@/lib/prisma'

function makeFormDataRequest(file: File | null): Request {
  const formData = new FormData()
  if (file) formData.append('file', file)
  return new Request('http://localhost/api/user/avatar', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/user/avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnsureAvatarBucket.mockResolvedValue(undefined)
    mockUploadAvatar.mockResolvedValue('https://example.supabase.co/storage/v1/object/public/avatars/user-1.webp?v=123')
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const file = new File(['x'], 'avatar.webp', { type: 'image/webp' })
    const res = await POST(makeFormDataRequest(file))
    expect(res.status).toBe(401)
  })

  it('缺少檔案回傳 400 AVATAR_INVALID', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await POST(makeFormDataRequest(null))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('AVATAR_INVALID')
  })

  it('非允許的檔案類型回傳 400 AVATAR_INVALID', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const file = new File(['x'], 'avatar.gif', { type: 'image/gif' })
    const res = await POST(makeFormDataRequest(file))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('AVATAR_INVALID')
  })

  it('超過大小上限回傳 400 AVATAR_INVALID', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const bigContent = new Uint8Array(5 * 1024 * 1024 + 1)
    const file = new File([bigContent], 'avatar.webp', { type: 'image/webp' })
    const res = await POST(makeFormDataRequest(file))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('AVATAR_INVALID')
  })

  it('成功上傳回傳 200 並更新 user.image', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
    const file = new File(['x'.repeat(10)], 'avatar.webp', { type: 'image/webp' })
    const res = await POST(makeFormDataRequest(file))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.image).toContain('avatars/user-1.webp')
    expect(mockEnsureAvatarBucket).toHaveBeenCalled()
    expect(mockUploadAvatar).toHaveBeenCalledWith('user-1', expect.any(Buffer), 'image/webp')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { image: data.image },
    })
  })
})

describe('DELETE /api/user/avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteAvatar.mockResolvedValue(undefined)
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE()
    expect(res.status).toBe(401)
  })

  it('成功移除回傳 200 image:null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
    const res = await DELETE()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.image).toBeNull()
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { image: null },
    })
    expect(mockDeleteAvatar).toHaveBeenCalledWith('user-1')
  })
})
