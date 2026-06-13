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

describe('GET /api/cards - OPCG ZH_TW alias canonicalization', () => {
  beforeEach(() => vi.clearAllMocks())

  it('OPCG+ZH_TW alias 卡：collectionStatus 查 canonicalCardId 而非 alias id', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const aliasCard = {
      id: 'zhtw-c1',
      name: '魯夫',
      imageSmall: '',
      rarity: null,
      cardNumber: 'OP01-001',
      isCollectible: false,
      canonicalCardId: 'ja-c1',
      set: { name: 'OP-01' },
    }
    vi.mocked(prisma.$transaction).mockResolvedValue([[aliasCard], 1])
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([
      { cardId: 'ja-c1', status: 'owned', quantity: 3 },
    ] as never)
    const req = new NextRequest('http://localhost/api/cards?game=OPCG&language=ZH_TW')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards[0].collectionStatus).toEqual({ owned: 3, wanted: null })
  })

  it('OPCG+ZH_TW：collectible 卡（台灣限定）使用自身 id 查 collectionStatus', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const twLimitedCard = {
      id: 'tw-limited-c1',
      name: '台灣限定卡',
      imageSmall: '',
      rarity: null,
      cardNumber: 'P-136',
      isCollectible: true,
      canonicalCardId: null,
      set: { name: 'ZH-TW Limited' },
    }
    vi.mocked(prisma.$transaction).mockResolvedValue([[twLimitedCard], 1])
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([
      { cardId: 'tw-limited-c1', status: 'owned', quantity: 1 },
    ] as never)
    const req = new NextRequest('http://localhost/api/cards?game=OPCG&language=ZH_TW')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards[0].collectionStatus).toEqual({ owned: 1, wanted: null })
  })

  it('OPCG+JA：response 不包含 canonicalCard include', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=OPCG&language=JA')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.not.objectContaining({ canonicalCard: expect.anything() }),
      })
    )
  })

  it('PTCG+ZH_TW：不受影響（無 canonicalCard include）', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=ZH_TW')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.not.objectContaining({ canonicalCard: expect.anything() }),
      })
    )
  })
})

describe('GET /api/cards - error handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('Prisma 拋出錯誤時回傳 500 JSON', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error('DB connection failed'))
    const req = new NextRequest('http://localhost/api/cards?game=OPCG&language=ZH_TW')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })
})

describe('GET /api/cards - externalId prefix search', () => {
  beforeEach(() => vi.clearAllMocks())

  it('有關鍵字時 where 條件包含 name contains 和 externalId startsWith 的 OR', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=pikachu')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'pikachu', mode: 'insensitive' } },
            { externalId: { startsWith: 'pikachu', mode: 'insensitive' } },
          ],
        }),
      })
    )
  })

  it('q=OP15 時 externalId startsWith 條件被帶入', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=OPCG&q=OP15')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'OP15', mode: 'insensitive' } },
            { externalId: { startsWith: 'OP15', mode: 'insensitive' } },
          ],
        }),
      })
    )
  })

  it('未傳 q 時 where 條件不包含 OR', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ OR: expect.anything() }),
      })
    )
  })

  it('keyword + language + setId 組合篩選時所有條件都被帶入 where', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=eevee&language=EN&setId=set123')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          game: 'PTCG',
          language: 'EN',
          setId: 'set123',
          OR: [
            { name: { contains: 'eevee', mode: 'insensitive' } },
            { externalId: { startsWith: 'eevee', mode: 'insensitive' } },
          ],
        }),
      })
    )
  })
})
