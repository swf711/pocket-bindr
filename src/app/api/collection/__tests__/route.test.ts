import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      findUnique: vi.fn(),
    },
    userCard: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/collection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const COLLECTIBLE_CARD = { isCollectible: true, canonicalCardId: null }
const ALIAS_CARD = { isCollectible: false, canonicalCardId: 'ja-card-1' }

describe('POST /api/collection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.card.findUnique).mockResolvedValue(COLLECTIBLE_CARD as never)
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ cardId: 'c1', status: 'owned' }))
    expect(res.status).toBe(401)
  })

  it('status=owned 時 upsert UserCard', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({
      id: 'uc1', userId: 'u1', cardId: 'c1', status: 'owned',
      quantity: 1, condition: null, notes: null,
      createdAt: new Date(), updatedAt: new Date(),
    })
    const res = await POST(makeRequest({ cardId: 'c1', status: 'owned' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ success: true, cardId: 'c1', status: 'owned' })
    expect(prisma.userCard.upsert).toHaveBeenCalledWith({
      where: { userId_cardId_status: { userId: 'u1', cardId: 'c1', status: 'owned' } },
      create: { userId: 'u1', cardId: 'c1', status: 'owned' },
      update: { status: 'owned' },
    })
  })

  it('status=null 時刪除 UserCard', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.userCard.deleteMany).mockResolvedValue({ count: 1 })
    const res = await POST(makeRequest({ cardId: 'c1', status: null, deleteStatus: 'owned' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ success: true, cardId: 'c1', status: null })
    expect(prisma.userCard.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', cardId: 'c1', status: 'owned' },
    })
  })

  it('status=null 且 deleteStatus 缺少時回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const res = await POST(makeRequest({ cardId: 'c1', status: null }))
    expect(res.status).toBe(400)
  })

  it('status=null 且 deleteStatus 不合法時回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const res = await POST(makeRequest({ cardId: 'c1', status: null, deleteStatus: 'invalid' }))
    expect(res.status).toBe(400)
  })

  it('alias 卡（isCollectible=false）：upsert 使用 canonicalCardId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.card.findUnique).mockResolvedValue(ALIAS_CARD as never)
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({
      id: 'uc1', userId: 'u1', cardId: 'ja-card-1', status: 'owned',
      quantity: 1, condition: null, notes: null,
      createdAt: new Date(), updatedAt: new Date(),
    })
    const res = await POST(makeRequest({ cardId: 'zhtw-alias-id', status: 'owned' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cardId).toBe('ja-card-1')
    expect(prisma.userCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId_cardId_status: expect.objectContaining({ cardId: 'ja-card-1' }) }),
      })
    )
  })

  it('alias 卡（isCollectible=false）：deleteMany 使用 canonicalCardId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.card.findUnique).mockResolvedValue(ALIAS_CARD as never)
    vi.mocked(prisma.userCard.deleteMany).mockResolvedValue({ count: 1 })
    const res = await POST(makeRequest({ cardId: 'zhtw-alias-id', status: null, deleteStatus: 'owned' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cardId).toBe('ja-card-1')
    expect(prisma.userCard.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', cardId: 'ja-card-1', status: 'owned' },
    })
  })

  it('collectible 卡（isCollectible=true）：使用原始 cardId，無重定向', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({
      id: 'uc1', userId: 'u1', cardId: 'c1', status: 'owned',
      quantity: 1, condition: null, notes: null,
      createdAt: new Date(), updatedAt: new Date(),
    })
    const res = await POST(makeRequest({ cardId: 'c1', status: 'owned' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cardId).toBe('c1')
    expect(prisma.userCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId_cardId_status: expect.objectContaining({ cardId: 'c1' }) }),
      })
    )
  })
})
