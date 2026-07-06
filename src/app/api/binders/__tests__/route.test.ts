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
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    $transaction: vi.fn(),
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
  coverColor: '#4A5568',
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
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.binder.aggregate).mockResolvedValue({ _max: { sortOrder: 0 } } as never)
  })

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
    vi.mocked(prisma.binder.count).mockResolvedValue(0)
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

  it('接受 grid_4x3', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.create).mockResolvedValue({ ...mockBinder, gridType: 'grid_4x3' } as never)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_4x3' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('拒絕已移除的 grid_3x4 回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x4' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('已有 3 本卡冊時回傳 409 binderLimitReached', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.count).mockResolvedValue(3)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '第四本', gridType: 'grid_3x3' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('binderLimitReached')
    expect(data.max).toBe(3)
  })

  it('已有 2 本卡冊時可正常建立，回傳 201', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.count).mockResolvedValue(2)
    vi.mocked(prisma.binder.create).mockResolvedValue(mockBinder as never)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '第三本', gridType: 'grid_3x3' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
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

  it('成功刪除並回傳 204，且連動扣減格位卡牌對應的 UserCard', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)

    const findManyMock = vi.fn().mockResolvedValue([
      { cardId: 'c1', status: 'owned' },
      { cardId: 'c1', status: 'owned' },
    ])
    const updateManyMock = vi.fn()
    const deleteManyMock = vi.fn()
    const binderDeleteMock = vi.fn()
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        binderSlot: { findMany: findManyMock },
        userCard: { updateMany: updateManyMock, deleteMany: deleteManyMock },
        binder: { delete: binderDeleteMock },
      } as never),
    )

    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(204)
    expect(findManyMock).toHaveBeenCalledWith({
      where: { binderId: 'binder-1', cardId: { not: null } },
      select: { cardId: true, status: true },
    })
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { userId: 'user-1', cardId: 'c1', status: 'owned' },
      data: { quantity: { decrement: 2 } },
    })
    expect(binderDeleteMock).toHaveBeenCalledWith({ where: { id: 'binder-1' } })
  })
})

describe('POST /api/binders - coverColor 驗證', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.binder.aggregate).mockResolvedValue({ _max: { sortOrder: 0 } } as never)
  })

  it('合法 hex 色碼，建立成功', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.create).mockResolvedValue({ ...mockBinder, coverColor: '#2C5282' } as never)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x3', coverColor: '#2C5282' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('未提供 coverColor，套用 DEFAULT_COVER_COLOR', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.create).mockResolvedValue(mockBinder as never)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x3' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(vi.mocked(prisma.binder.create).mock.calls[0][0].data.coverColor).toBe('#4A5568')
  })

  it('非法格式（"red"），回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x3', coverColor: 'red' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('非法格式（"#zzz"），回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x3', coverColor: '#zzz' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/binders - description 驗證', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.binder.aggregate).mockResolvedValue({ _max: { sortOrder: 0 } } as never)
  })

  it('description 省略時建立成功', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.count).mockResolvedValue(0)
    vi.mocked(prisma.binder.create).mockResolvedValue({ ...mockBinder, description: null } as never)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x3' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('description 為有效字串時建立成功', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.count).mockResolvedValue(0)
    vi.mocked(prisma.binder.create).mockResolvedValue({ ...mockBinder, description: '簡短描述' } as never)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x3', description: '簡短描述' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('description 超過 150 字元回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x3', description: 'a'.repeat(151) }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('description 為非字串類型回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x3', description: 123 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  /**
   * 迴歸測試：CreateBinderDialog 的 zod descriptionSchema 在前端已把「未填描述」
   * transform 成 null 才送出（見 src/lib/schemas/binder.ts descriptionSchema），
   * 而非省略欄位或空字串。route 必須把 null 視為「無描述」而非非法輸入，
   * 否則所有未填描述的建立卡冊請求都會被誤判 400（RHF+zod 重構曾一度造成此迴歸）。
   */
  it('description 為 null 時視為無描述，建立成功', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.count).mockResolvedValue(0)
    vi.mocked(prisma.binder.create).mockResolvedValue({ ...mockBinder, description: null } as never)
    const req = new NextRequest('http://localhost/api/binders', {
      method: 'POST',
      body: JSON.stringify({ name: '測試', gridType: 'grid_3x3', description: null }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})

describe('PATCH /api/binders/[id] - description 更新', () => {
  beforeEach(() => vi.clearAllMocks())

  it('description 更新為有效字串，成功回傳 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binder.update).mockResolvedValue({ ...mockBinder, description: '新描述' } as never)
    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'PATCH',
      body: JSON.stringify({ description: '新描述' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(200)
  })

  it('description 超過 150 字元回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'a'.repeat(151) }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/binders/[id] - coverColor 更新', () => {
  beforeEach(() => vi.clearAllMocks())

  it('成功更新 coverColor', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binder.update).mockResolvedValue({ ...mockBinder, coverColor: '#9B2C2C' } as never)
    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'PATCH',
      body: JSON.stringify({ coverColor: '#9B2C2C' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.coverColor).toBe('#9B2C2C')
  })

  it('非本人卡冊回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' } as never)
    const req = new NextRequest('http://localhost/api/binders/binder-1', {
      method: 'PATCH',
      body: JSON.stringify({ coverColor: '#9B2C2C' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'binder-1' }) })
    expect(res.status).toBe(403)
  })
})
