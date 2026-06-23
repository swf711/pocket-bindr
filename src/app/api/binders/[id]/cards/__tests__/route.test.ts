import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn(), update: vi.fn() },
    card: { findUnique: vi.fn() },
    binderSlot: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      createMany: vi.fn(),
    },
    userCard: { upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/binders/b1/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

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

const mockCard = {
  id: 'c1',
  name: 'Pikachu',
  game: 'PTCG' as const,
  language: 'EN' as const,
  setId: 's1',
  imageUrl: null,
  rarity: null,
  number: '001',
  createdAt: new Date(),
} as never

const mockUserCard = {
  id: 'uc1',
  userId: 'u1',
  cardId: 'c1',
  status: 'owned' as const,
  quantity: 1,
  condition: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('POST /api/binders/[id]/cards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: $transaction calls the callback with prisma as tx
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => cb(prisma as any))
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ cardId: 'c1', status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(401)
  })

  it('binder 不存在回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(null)
    const res = await POST(makeRequest({ cardId: 'c1', status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(403)
  })

  it('binder 屬於他人回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other-user' })
    const res = await POST(makeRequest({ cardId: 'c1', status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(403)
  })

  it('cardId 不存在回傳 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findUnique).mockResolvedValue(null)
    const res = await POST(makeRequest({ cardId: 'nonexistent', status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(404)
  })

  it('quantity 超出範圍回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard)

    // quantity = 0
    const res0 = await POST(makeRequest({ cardId: 'c1', status: 'owned', quantity: 0 }), makeContext('b1'))
    expect(res0.status).toBe(400)

    // quantity = 100
    const res100 = await POST(makeRequest({ cardId: 'c1', status: 'owned', quantity: 100 }), makeContext('b1'))
    expect(res100.status).toBe(400)
  })

  it('status 不合法回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard)
    const res = await POST(makeRequest({ cardId: 'c1', status: 'invalid', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(400)
  })

  it('成功：upsert UserCard quantity 正確累加', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard)
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([])
    vi.mocked(prisma.binderSlot.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.binderSlot.createMany).mockResolvedValue({ count: 2 })
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({ ...mockUserCard, quantity: 2 })

    await POST(makeRequest({ cardId: 'c1', status: 'owned', quantity: 2 }), makeContext('b1'))

    expect(prisma.userCard.upsert).toHaveBeenCalledWith({
      where: { userId_cardId_status: { userId: 'u1', cardId: 'c1', status: 'owned' } },
      create: { userId: 'u1', cardId: 'c1', status: 'owned', quantity: 2 },
      update: { quantity: { increment: 2 } },
    })
  })

  it('成功：空格位優先填入', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard)

    const emptySlot1 = { id: 'slot1', binderId: 'b1', cardId: null, status: null, pageNumber: 1, slotIndex: 0, createdAt: new Date() }
    const emptySlot2 = { id: 'slot2', binderId: 'b1', cardId: null, status: null, pageNumber: 1, slotIndex: 1, createdAt: new Date() }
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([emptySlot1, emptySlot2])
    vi.mocked(prisma.binderSlot.update).mockResolvedValue(emptySlot1 as any)
    vi.mocked(prisma.userCard.upsert).mockResolvedValue(mockUserCard)

    await POST(makeRequest({ cardId: 'c1', status: 'owned', quantity: 2 }), makeContext('b1'))

    // update called twice (filling both empty slots), createMany NOT called
    expect(prisma.binderSlot.update).toHaveBeenCalledTimes(2)
    expect(prisma.binderSlot.createMany).not.toHaveBeenCalled()
  })

  it('成功：不足才新增頁', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard)

    // Only 1 empty slot exists, but we're adding 3
    const emptySlot = { id: 'slot1', binderId: 'b1', cardId: null, status: null, pageNumber: 1, slotIndex: 0, createdAt: new Date() }
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([emptySlot])
    vi.mocked(prisma.binderSlot.update).mockResolvedValue(emptySlot as any)

    const lastSlot = { id: 'slotLast', binderId: 'b1', cardId: 'other', status: 'owned', pageNumber: 1, slotIndex: 2, createdAt: new Date() }
    vi.mocked(prisma.binderSlot.findFirst).mockResolvedValue(lastSlot as any)
    vi.mocked(prisma.binderSlot.createMany).mockResolvedValue({ count: 2 })
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({ ...mockUserCard, quantity: 3 })

    await POST(makeRequest({ cardId: 'c1', status: 'owned', quantity: 3 }), makeContext('b1'))

    // update called once (filling 1 empty slot)
    expect(prisma.binderSlot.update).toHaveBeenCalledTimes(1)
    // createMany called with 2 new slots
    expect(prisma.binderSlot.createMany).toHaveBeenCalledTimes(1)
    const createManyCall = vi.mocked(prisma.binderSlot.createMany).mock.calls[0]?.[0]
    expect(createManyCall?.data).toHaveLength(2)
  })

  it('成功：回傳 slotsAdded 與 userCard', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard)
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([])
    vi.mocked(prisma.binderSlot.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.binderSlot.createMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({ ...mockUserCard, quantity: 1 })

    const res = await POST(makeRequest({ cardId: 'c1', status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toMatchObject({
      slotsAdded: 1,
      userCard: {
        id: 'uc1',
        cardId: 'c1',
        status: 'owned',
        quantity: 1,
      },
    })
  })

  it('alias 卡（isCollectible=false）：寫入重定向至 canonicalCardId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    // First call: alias card; second call: canonical card (exists)
    vi.mocked(prisma.card.findUnique)
      .mockResolvedValueOnce({ id: 'zhtw-c1', isCollectible: false, canonicalCardId: 'ja-c1' } as never)
      .mockResolvedValueOnce({ id: 'ja-c1', isCollectible: true, canonicalCardId: null } as never)
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([])
    vi.mocked(prisma.binderSlot.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.binderSlot.createMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({ ...mockUserCard, cardId: 'ja-c1', quantity: 1 })

    await POST(makeRequest({ cardId: 'zhtw-c1', status: 'owned', quantity: 1 }), makeContext('b1'))

    expect(prisma.userCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId_cardId_status: expect.objectContaining({ cardId: 'ja-c1' }) }),
      })
    )
  })

  it('alias 卡 canonical 不存在時回傳 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findUnique)
      .mockResolvedValueOnce({ id: 'zhtw-c1', isCollectible: false, canonicalCardId: 'ja-c1' } as never)
      .mockResolvedValueOnce(null)
    const res = await POST(makeRequest({ cardId: 'zhtw-c1', status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Canonical card not found')
  })
})
