import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn() },
    binderSlot: { findUnique: vi.fn(), create: vi.fn() },
    card: { findUnique: vi.fn() },
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
  return new Request('http://localhost/api/binders/b1/slots', {
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

const mockCreatedSlot = {
  id: 'slot1',
  pageNumber: 1,
  slotIndex: 0,
  status: 'owned' as const,
  card: { id: 'c1', name: 'Pikachu', imageSmall: 'x.png', language: 'EN', cardNumber: '001', rarity: null },
}

const validBody = { pageNumber: 1, slotIndex: 0, cardId: 'c1', status: 'owned' }

describe('POST /api/binders/[id]/slots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => cb(prisma as never))
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody), makeContext('b1'))
    expect(res.status).toBe(401)
  })

  it('非本人卡冊回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' })
    const res = await POST(makeRequest(validBody), makeContext('b1'))
    expect(res.status).toBe(403)
  })

  it('binder 不存在回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(null)
    const res = await POST(makeRequest(validBody), makeContext('b1'))
    expect(res.status).toBe(403)
  })

  it('pageNumber 不合法回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    const res = await POST(makeRequest({ ...validBody, pageNumber: 0 }), makeContext('b1'))
    expect(res.status).toBe(400)
  })

  it('slotIndex 超出範圍回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    // grid_3x3 has 9 slots per page (index 0-8)
    const res = await POST(makeRequest({ ...validBody, slotIndex: 9 }), makeContext('b1'))
    expect(res.status).toBe(400)
  })

  it('cardId 缺漏回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 0, status: 'owned' }), makeContext('b1'))
    expect(res.status).toBe(400)
  })

  it('status 不合法回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    const res = await POST(makeRequest({ ...validBody, status: 'invalid' }), makeContext('b1'))
    expect(res.status).toBe(400)
  })

  it('該位置已有格位回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue({ id: 'existing' } as never)
    const res = await POST(makeRequest(validBody), makeContext('b1'))
    expect(res.status).toBe(400)
  })

  it('cardId 不存在回傳 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.card.findUnique).mockResolvedValue(null)
    const res = await POST(makeRequest({ ...validBody, cardId: 'nonexistent' }), makeContext('b1'))
    expect(res.status).toBe(404)
  })

  it('成功：建立新 UserCard quantity=1，slot 落位於指定位置', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.card.findUnique).mockResolvedValue({ id: 'c1', isCollectible: true, canonicalCardId: null } as never)
    vi.mocked(prisma.userCard.upsert).mockResolvedValue(mockUserCard)
    vi.mocked(prisma.binderSlot.create).mockResolvedValue(mockCreatedSlot as never)

    const res = await POST(makeRequest(validBody), makeContext('b1'))
    expect(res.status).toBe(200)

    expect(prisma.userCard.upsert).toHaveBeenCalledWith({
      where: { userId_cardId_status: { userId: 'u1', cardId: 'c1', status: 'owned' } },
      create: { userId: 'u1', cardId: 'c1', status: 'owned', quantity: 1 },
      update: { quantity: { increment: 1 } },
    })
    expect(prisma.binderSlot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { binderId: 'b1', pageNumber: 1, slotIndex: 0, cardId: 'c1', status: 'owned' },
      }),
    )

    const data = await res.json()
    expect(data).toMatchObject({
      slot: { id: 'slot1', pageNumber: 1, slotIndex: 0, status: 'owned' },
      userCard: { id: 'uc1', cardId: 'c1', status: 'owned', quantity: 1 },
    })
  })

  it('成功：該卡本卡冊已有 UserCard，quantity +1 累加', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.card.findUnique).mockResolvedValue({ id: 'c1', isCollectible: true, canonicalCardId: null } as never)
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({ ...mockUserCard, quantity: 2 })
    vi.mocked(prisma.binderSlot.create).mockResolvedValue(mockCreatedSlot as never)

    await POST(makeRequest(validBody), makeContext('b1'))

    expect(prisma.userCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { quantity: { increment: 1 } } }),
    )
  })

  it('OPCG ZH_TW alias 卡：resolvedCardId 指向 canonicalCardId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.card.findUnique)
      .mockResolvedValueOnce({ id: 'zhtw-c1', isCollectible: false, canonicalCardId: 'ja-c1' } as never)
      .mockResolvedValueOnce({ id: 'ja-c1', isCollectible: true, canonicalCardId: null } as never)
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({ ...mockUserCard, cardId: 'ja-c1' })
    vi.mocked(prisma.binderSlot.create).mockResolvedValue(mockCreatedSlot as never)

    await POST(makeRequest({ ...validBody, cardId: 'zhtw-c1' }), makeContext('b1'))

    expect(prisma.userCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId_cardId_status: expect.objectContaining({ cardId: 'ja-c1' }) }),
      }),
    )
    expect(prisma.binderSlot.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ cardId: 'ja-c1' }) }),
    )
  })

  it('canonical 卡不存在回傳 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.card.findUnique)
      .mockResolvedValueOnce({ id: 'zhtw-c1', isCollectible: false, canonicalCardId: 'ja-c1' } as never)
      .mockResolvedValueOnce(null)

    const res = await POST(makeRequest({ ...validBody, cardId: 'zhtw-c1' }), makeContext('b1'))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Canonical card not found')
  })
})
