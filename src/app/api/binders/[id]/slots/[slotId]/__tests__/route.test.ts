import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn() },
    binderSlot: { findUnique: vi.fn(), update: vi.fn() },
    userCard: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { DELETE, PATCH } from '../route'
import { prisma } from '@/lib/prisma'

const mockBinder = { id: 'b1', userId: 'u1', name: 'Test', gridType: 'grid_3x3', coverColor: '#4A5568', settings: null, createdAt: new Date(), updatedAt: new Date() }
const mockSlot = { id: 's1', binderId: 'b1', cardId: 'c1', status: 'owned' as const, pageNumber: 1, slotIndex: 0, createdAt: new Date() }

function makeContext(binderId: string, slotId: string) {
  return { params: Promise.resolve({ id: binderId, slotId }) }
}

describe('DELETE /api/binders/[id]/slots/[slotId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeContext('b1', 's1'))
    expect(res.status).toBe(401)
  })

  it('他人卡冊回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' } as never)
    const res = await DELETE(new Request('http://localhost'), makeContext('b1', 's1'))
    expect(res.status).toBe(403)
  })

  it('slotId 不存在回傳 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeContext('b1', 's1'))
    expect(res.status).toBe(404)
  })

  it('正確刪除 slot 並 quantity -1', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(mockSlot as never)
    const mockUserCard = { id: 'uc1', quantity: 3 }
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn({
        binderSlot: { delete: vi.fn() },
        userCard: {
          findUnique: vi.fn().mockResolvedValue(mockUserCard),
          update: vi.fn(),
          delete: vi.fn(),
        },
      } as never)
    })
    const res = await DELETE(new Request('http://localhost'), makeContext('b1', 's1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.deleted).toBe(true)
  })

  it('quantity 歸 0 時刪除 UserCard', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(mockSlot as never)
    const deleteMock = vi.fn()
    const updateMock = vi.fn()
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn({
        binderSlot: { delete: vi.fn() },
        userCard: {
          findUnique: vi.fn().mockResolvedValue({ id: 'uc1', quantity: 1 }),
          update: updateMock,
          delete: deleteMock,
        },
      } as never)
    })
    await DELETE(new Request('http://localhost'), makeContext('b1', 's1'))
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 'uc1' } })
    expect(updateMock).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/binders/[id]/slots/[slotId] (move)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ pageNumber: 2, slotIndex: 1 }),
    })
    const res = await PATCH(req, makeContext('b1', 's1'))
    expect(res.status).toBe(401)
  })

  it('正確更新 pageNumber + slotIndex', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(mockSlot as never)
    vi.mocked(prisma.binderSlot.update).mockResolvedValue({ id: 's1', pageNumber: 2, slotIndex: 1 } as never)
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageNumber: 2, slotIndex: 1 }),
    })
    const res = await PATCH(req, makeContext('b1', 's1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.pageNumber).toBe(2)
    expect(data.slotIndex).toBe(1)
  })
})
