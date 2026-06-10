import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { GET, POST } from '../route'
import { PATCH, DELETE } from '../[id]/route'
import { prisma } from '@/lib/prisma'

const mockBinder = {
  id: 'binder-1',
  userId: 'user-1',
  name: '我的卡冊',
  gridType: 'grid_3x3',
  settings: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  _count: { slots: 3 },
}

describe('GET /api/binders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('回傳登入使用者的卡冊列表與格位數量', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findMany).mockResolvedValue([mockBinder] as never)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('binder-1')
  })
})

describe('POST /api/binders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x3' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('成功建立卡冊', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.create).mockResolvedValue(mockBinder as never)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '我的卡冊', gridType: 'grid_3x3' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('binder-1')
  })

  it('name 為空回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '', gridType: 'grid_3x3' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('name 超過 50 字回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: 'a'.repeat(51), gridType: 'grid_3x3' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('gridType 無效回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'invalid_type' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/binders/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: '新名稱' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(401)
  })

  it('存取他人卡冊回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({
      ...mockBinder,
      userId: 'other-user',
    } as never)
    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: '新名稱' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(403)
  })

  it('成功更新名稱', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binder.update).mockResolvedValue({
      ...mockBinder,
      name: '新名稱',
    } as never)
    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: '新名稱' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('新名稱')
  })
})

describe('DELETE /api/binders/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(401)
  })

  it('存取他人卡冊回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({
      ...mockBinder,
      userId: 'other-user',
    } as never)
    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(403)
  })

  it('成功刪除並回傳 204', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binder.delete).mockResolvedValue(mockBinder as never)
    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(204)
  })
})
