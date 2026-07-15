import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: { findUnique: vi.fn() },
    userCard: { findMany: vi.fn() },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

vi.mock('@/lib/rate-limit', () => ({
  cardsReadIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  getClientIp: () => '127.0.0.1',
}))

import { GET } from '../route'
import { prisma } from '@/lib/prisma'

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/cards/[id]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('回傳卡牌完整資料含 set 資訊', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      id: 'card1',
      name: 'Pikachu',
      imageSmall: '',
      rarity: null,
      cardNumber: '001',
      isCollectible: true,
      canonicalCardId: null,
      set: { id: 'set1', name: 'Base' },
      canonicalCard: null,
    } as never)
    const res = await GET(new Request('http://localhost/api/cards/card1'), makeContext('card1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('card1')
    expect(data.set).toEqual({ id: 'set1', name: 'Base' })
  })

  it('查無卡牌回 404', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findUnique).mockResolvedValue(null as never)
    const res = await GET(new Request('http://localhost/api/cards/missing'), makeContext('missing'))
    expect(res.status).toBe(404)
  })

  it('未登入時 collectionStatus 為 { owned: null, wanted: null }', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001',
      isCollectible: true, canonicalCardId: null, set: { name: 'Base' }, canonicalCard: null,
    } as never)
    const res = await GET(new Request('http://localhost/api/cards/card1'), makeContext('card1'))
    const data = await res.json()
    expect(data.collectionStatus).toEqual({ owned: null, wanted: null })
    expect(prisma.userCard.findMany).not.toHaveBeenCalled()
  })

  it('已登入時回傳正確 owned/wanted 數量', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001',
      isCollectible: true, canonicalCardId: null, set: { name: 'Base' }, canonicalCard: null,
    } as never)
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([
      { cardId: 'card1', status: 'owned', quantity: 2 },
      { cardId: 'card1', status: 'wanted', quantity: 1 },
    ] as never)
    const res = await GET(new Request('http://localhost/api/cards/card1'), makeContext('card1'))
    const data = await res.json()
    expect(data.collectionStatus).toEqual({ owned: 2, wanted: 1 })
  })

  it('OPCG ZH_TW alias 卡正確 resolve canonicalCard 並回傳 collectionStatus', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      id: 'zhtw-c1', name: '魯夫', imageSmall: '', rarity: null, cardNumber: 'OP01-001',
      isCollectible: false, canonicalCardId: 'ja-c1', set: { name: 'OP-01' },
      canonicalCard: { id: 'ja-c1', imageSmall: 'ja.png', imageLarge: 'ja-l.png', language: 'JA' },
    } as never)
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([
      { cardId: 'ja-c1', status: 'owned', quantity: 3 },
    ] as never)
    const res = await GET(new Request('http://localhost/api/cards/zhtw-c1'), makeContext('zhtw-c1'))
    const data = await res.json()
    expect(data.collectionStatus).toEqual({ owned: 3, wanted: null })
  })

  it('Prisma 拋出錯誤時回傳 500 JSON', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findUnique).mockRejectedValue(new Error('DB connection failed'))
    const res = await GET(new Request('http://localhost/api/cards/card1'), makeContext('card1'))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })
})
