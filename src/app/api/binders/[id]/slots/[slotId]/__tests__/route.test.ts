import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn() },
    binderSlot: { findUnique: vi.fn(), update: vi.fn() },
    userCard: { updateMany: vi.fn(), deleteMany: vi.fn() },
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

  it('正確刪除 slot 並連動扣減對應 UserCard.quantity', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(mockSlot as never)
    const updateManyMock = vi.fn()
    const deleteManyMock = vi.fn()
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      await fn({
        binderSlot: { delete: vi.fn() },
        userCard: { updateMany: updateManyMock, deleteMany: deleteManyMock },
      } as never)
    })
    const res = await DELETE(new Request('http://localhost'), makeContext('b1', 's1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.deleted).toBe(true)
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { userId: 'u1', cardId: 'c1', status: 'owned' },
      data: { quantity: { decrement: 1 } },
    })
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { userId: 'u1', cardId: 'c1', status: 'owned', quantity: { lte: 0 } },
    })
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
