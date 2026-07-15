import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn(), update: vi.fn() },
    card: { findMany: vi.fn() },
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

vi.mock('@/lib/rate-limit', () => ({
  batchAddIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  batchAddUserLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
}))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import { batchAddIpLimiter, batchAddUserLimiter } from '@/lib/rate-limit'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/binders/b1/cards/batch', {
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

function cardRow(id: string, isCollectible = true, canonicalCardId: string | null = null) {
  return { id, isCollectible, canonicalCardId }
}

describe('POST /api/binders/[id]/cards/batch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => cb(prisma as never))
    vi.mocked(batchAddIpLimiter.limit).mockResolvedValue({ success: true } as never)
    vi.mocked(batchAddUserLimiter.limit).mockResolvedValue({ success: true } as never)
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ cardIds: ['c1'], status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(401)
  })

  it('binder 屬於他人回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' })
    const res = await POST(makeRequest({ cardIds: ['c1'], status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(403)
  })

  it('IP 限流觸發回傳 429', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(batchAddIpLimiter.limit).mockResolvedValue({ success: false } as never)
    const res = await POST(makeRequest({ cardIds: ['c1'], status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(429)
  })

  it('user 限流觸發回傳 429', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(batchAddUserLimiter.limit).mockResolvedValue({ success: false } as never)
    const res = await POST(makeRequest({ cardIds: ['c1'], status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(429)
  })

  it('空 cardIds 回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    const res = await POST(makeRequest({ cardIds: [], status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(400)
  })

  it('超過 MAX_BATCH_CARDS 回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    const tooMany = Array.from({ length: 61 }, (_, i) => `c${i}`)
    const res = await POST(makeRequest({ cardIds: tooMany, status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(400)
  })

  it('任一 cardId 不存在回傳 404 附 invalidCardIds', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findMany).mockResolvedValue([cardRow('c1')] as never)
    const res = await POST(
      makeRequest({ cardIds: ['c1', 'missing'], status: 'owned', quantity: 1 }),
      makeContext('b1'),
    )
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.invalidCardIds).toEqual(['missing'])
  })

  it('成功：聚合 upsert（不同卡各自一次 upsert）', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findMany).mockResolvedValue([cardRow('c1'), cardRow('c2')] as never)
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([])
    vi.mocked(prisma.binderSlot.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.binderSlot.createMany).mockResolvedValue({ count: 4 })
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({} as never)

    const res = await POST(
      makeRequest({ cardIds: ['c1', 'c2'], status: 'owned', quantity: 2 }),
      makeContext('b1'),
    )
    expect(res.status).toBe(200)
    expect(prisma.userCard.upsert).toHaveBeenCalledTimes(2)
    expect(prisma.userCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_cardId_status: { userId: 'u1', cardId: 'c1', status: 'owned' } },
        create: expect.objectContaining({ quantity: 2 }),
      }),
    )
    const data = await res.json()
    expect(data).toMatchObject({ slotsAdded: 4, cardsAdded: 2 })
  })

  it('alias 卡逐格保留 displayCardId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findMany).mockResolvedValue([cardRow('zhtw-c1', false, 'ja-c1')] as never)
    // canonical existence check
    vi.mocked(prisma.card.findMany).mockResolvedValueOnce([cardRow('zhtw-c1', false, 'ja-c1')] as never)
    vi.mocked(prisma.card.findMany).mockResolvedValueOnce([cardRow('ja-c1')] as never)
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([])
    vi.mocked(prisma.binderSlot.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.binderSlot.createMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({} as never)

    await POST(makeRequest({ cardIds: ['zhtw-c1'], status: 'owned', quantity: 1 }), makeContext('b1'))

    expect(prisma.userCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ cardId: 'ja-c1', displayCardId: 'zhtw-c1' }),
      }),
    )
    const createManyArg = vi.mocked(prisma.binderSlot.createMany).mock.calls[0]?.[0]
    const createdSlots = createManyArg?.data as Array<{ cardId: string; displayCardId?: string | null }>
    expect(createdSlots[0]).toMatchObject({ cardId: 'ja-c1', displayCardId: 'zhtw-c1' })
  })

  it('撞頁數上限時整批拒絕回傳 409', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.card.findMany).mockResolvedValue([cardRow('c1')] as never)
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([])
    // Last slot already at the very last allowed absolute index (3x3 grid)
    const slotsPerPage = 9
    const maxAbsoluteIndex = 100 * slotsPerPage - 1 // MAX_PAGES_PER_BINDER * slotsPerPage - 1
    vi.mocked(prisma.binderSlot.findFirst).mockResolvedValue({
      pageNumber: Math.floor(maxAbsoluteIndex / slotsPerPage) + 1,
      slotIndex: maxAbsoluteIndex % slotsPerPage,
    } as never)

    const res = await POST(makeRequest({ cardIds: ['c1'], status: 'owned', quantity: 1 }), makeContext('b1'))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('pageLimitReached')
    expect(prisma.binderSlot.createMany).not.toHaveBeenCalled()
    expect(prisma.userCard.upsert).not.toHaveBeenCalled()
  })
})
