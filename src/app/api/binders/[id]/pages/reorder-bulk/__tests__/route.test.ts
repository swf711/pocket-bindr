import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { PATCH } from '../route'
import { prisma } from '@/lib/prisma'

const mockBinder = {
  id: 'b1',
  userId: 'u1',
  name: 'Test',
  gridType: 'grid_3x3',
  coverColor: '#4A5568',
  settings: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockSlots = [
  { id: 's1', binderId: 'b1', pageNumber: 1, slotIndex: 0, cardId: 'c1', status: 'owned', card: { id: 'c1', name: 'Card A', imageSmall: null, language: 'EN', cardNumber: '001', rarity: 'Common' } },
  { id: 's2', binderId: 'b1', pageNumber: 2, slotIndex: 0, cardId: 'c2', status: 'owned', card: { id: 'c2', name: 'Card B', imageSmall: null, language: 'EN', cardNumber: '002', rarity: 'Common' } },
]

function makeRequest(body: unknown) {
  return new Request('http://localhost', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/binders/[id]/pages/reorder-bulk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ newOrder: [2, 1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(401)
  })

  it('非本人 binder 回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' } as never)
    const res = await PATCH(makeRequest({ newOrder: [2, 1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(403)
  })

  it('newOrder 非陣列回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    const res = await PATCH(makeRequest({ newOrder: 'bad' }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(400)
  })

  it('newOrder 不是完整 1..N 排列回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    const res = await PATCH(makeRequest({ newOrder: [1, 3] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(400)
  })

  it('newOrder 有重複頁碼回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    const res = await PATCH(makeRequest({ newOrder: [1, 1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(400)
  })

  it('成功：呼叫 $transaction 並回傳 slots', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return fn({
        $executeRaw: vi.fn().mockResolvedValue(0),
        binderSlot: { findMany: vi.fn().mockResolvedValue(mockSlots) },
      } as never)
    })
    const res = await PATCH(makeRequest({ newOrder: [2, 1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('slots')
    expect(Array.isArray(data.slots)).toBe(true)
  })

  it('成功：單頁 newOrder=[1] 正常回傳', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return fn({
        $executeRaw: vi.fn().mockResolvedValue(0),
        binderSlot: { findMany: vi.fn().mockResolvedValue([mockSlots[0]]) },
      } as never)
    })
    const res = await PATCH(makeRequest({ newOrder: [1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(200)
  })
})
