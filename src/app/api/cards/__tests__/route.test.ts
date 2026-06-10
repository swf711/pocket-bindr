import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    card: { findMany: vi.fn(), count: vi.fn() },
    userCard: { findMany: vi.fn() },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { GET } from '../route'
import { prisma } from '@/lib/prisma'

describe('GET /api/cards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('game 未傳入時回傳 400', async () => {
    const req = new NextRequest('http://localhost/api/cards')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('game 值無效時回傳 400', async () => {
    const req = new NextRequest('http://localhost/api/cards?game=INVALID')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('game=PTCG 時正確呼叫 prisma 並回傳分頁資料', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('cards')
    expect(data).toHaveProperty('totalPages')
    expect(data).toHaveProperty('page', 1)
    expect(data).toHaveProperty('pageSize', 20)
  })

  it('language 值無效時回傳 400', async () => {
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=INVALID')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('language must be one of EN, JA, ZH_TW')
  })

  it('language=JA 時 where 條件包含 language: JA', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=JA')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ game: 'PTCG', language: 'JA' }),
      })
    )
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ language: 'JA' }),
    })
  })

  it('未傳 language 時 where 條件預設為 EN', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ language: 'EN' }),
      })
    )
  })

  it('未登入時每張卡的 collectionStatus 均為 { owned: null, wanted: null }', async () => {
    mockAuth.mockResolvedValue(null)
    const mockCard = { id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } }
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockCard], 1])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards[0].collectionStatus).toEqual({ owned: null, wanted: null })
    expect(prisma.userCard.findMany).not.toHaveBeenCalled()
  })

  it('登入用戶有 owned 記錄時 collectionStatus.owned 為 quantity 值', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const mockCard = { id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } }
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockCard], 1])
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([
      { cardId: 'card1', status: 'owned', quantity: 2 },
    ] as never)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards[0].collectionStatus).toEqual({ owned: 2, wanted: null })
  })

  it('登入用戶有 wanted 記錄時 collectionStatus.wanted 為 quantity 值', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const mockCard = { id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } }
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockCard], 1])
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([
      { cardId: 'card1', status: 'wanted', quantity: 1 },
    ] as never)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards[0].collectionStatus).toEqual({ owned: null, wanted: 1 })
  })

  it('同一張卡同時有 owned 和 wanted 記錄時兩者均回傳 quantity', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const mockCard = { id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } }
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockCard], 1])
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([
      { cardId: 'card1', status: 'owned', quantity: 3 },
      { cardId: 'card1', status: 'wanted', quantity: 1 },
    ] as never)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards[0].collectionStatus).toEqual({ owned: 3, wanted: 1 })
  })

  it('登入用戶無任何收藏記錄的卡片 collectionStatus 均為 null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const mockCard = { id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } }
    vi.mocked(prisma.$transaction).mockResolvedValue([[mockCard], 1])
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([] as never)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards[0].collectionStatus).toEqual({ owned: null, wanted: null })
  })
})
