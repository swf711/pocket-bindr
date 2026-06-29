import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

vi.mock('@/lib/share-token', () => ({
  generateShareToken: vi.fn(() => 'abc123deadbeef0011223344556677ff'),
}))

vi.mock('@/lib/binder-cache', () => ({
  revalidatePublicBinder: vi.fn(),
}))

import { POST, DELETE } from '../route'
import { prisma } from '@/lib/prisma'

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

const mockBinder = {
  id: 'b1',
  userId: 'u1',
  name: 'Test Binder',
  gridType: 'grid_3x3' as const,
  coverColor: '#4A5568',
  description: null,
  settings: null,
  sortOrder: 0,
  shareToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('POST /api/binders/[id]/share', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AUTH_URL = 'https://example.com'
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(new Request('http://localhost'), makeContext('b1'))
    expect(res.status).toBe(401)
  })

  it('binder 不存在回傳 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(null)
    const res = await POST(new Request('http://localhost'), makeContext('b1'))
    expect(res.status).toBe(404)
  })

  it('非本人 binder 回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' })
    const res = await POST(new Request('http://localhost'), makeContext('b1'))
    expect(res.status).toBe(403)
  })

  it('首次啟用 → 生成 shareToken 並回傳 shareUrl', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, shareToken: null })
    vi.mocked(prisma.binder.update).mockResolvedValue({ ...mockBinder, shareToken: 'abc123deadbeef0011223344556677ff' })

    const res = await POST(new Request('http://localhost'), makeContext('b1'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.shareToken).toBe('abc123deadbeef0011223344556677ff')
    expect(data.shareUrl).toBe('https://example.com/b/abc123deadbeef0011223344556677ff')
    expect(prisma.binder.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { shareToken: 'abc123deadbeef0011223344556677ff' },
    })
  })

  it('重複啟用（已有 token）→ 回傳相同 token，不寫 DB（idempotent）', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, shareToken: 'existingtoken123' })

    const res = await POST(new Request('http://localhost'), makeContext('b1'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.shareToken).toBe('existingtoken123')
    expect(data.shareUrl).toContain('existingtoken123')
    expect(prisma.binder.update).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/binders/[id]/share', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeContext('b1'))
    expect(res.status).toBe(401)
  })

  it('非本人 binder 回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' })
    const res = await DELETE(new Request('http://localhost'), makeContext('b1'))
    expect(res.status).toBe(403)
  })

  it('撤銷成功 → shareToken 設為 null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, shareToken: 'sometoken' })
    vi.mocked(prisma.binder.update).mockResolvedValue({ ...mockBinder, shareToken: null })

    const res = await DELETE(new Request('http://localhost'), makeContext('b1'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(prisma.binder.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { shareToken: null },
    })
  })
})
