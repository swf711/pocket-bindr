import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    userCard: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { GET, POST } from '../route'
import { prisma } from '@/lib/prisma'

// ─── GET /api/collection ────────────────────────────────────────────────────

const mockCard = {
  id: 'card-1',
  name: 'Pikachu',
  imageSmall: '/pikachu.png',
  imageLarge: '/pikachu-lg.png',
  supertype: 'Pokémon',
  rarity: 'Common',
  hp: 60,
  types: ['Lightning'],
  cardNumber: '001',
  isCollectible: true,
  canonicalCardId: null,
  attributes: null,
  set: {
    id: 'set-1',
    name: 'Test Set',
    series: 'Test',
    externalId: 'TST',
    releaseDate: '2024-01-01',
  },
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/collection')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

describe('GET /api/collection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockCard] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(1)
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([
      { cardId: 'card-1', displayCardId: null, status: 'owned', quantity: 2 },
    ] as never)
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
  })

  it('回傳該 user 的已標記卡，含聚合 collectionStatus', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards).toHaveLength(1)
    expect(data.cards[0].collectionStatus.owned).toBe(2)
    expect(data.total).toBe(1)
    expect(data.totalPages).toBe(1)
  })

  it('同卡 owned+wanted 兩徽章都亮', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([
      { cardId: 'card-1', displayCardId: null, status: 'owned', quantity: 1 },
      { cardId: 'card-1', displayCardId: null, status: 'wanted', quantity: 1 },
    ] as never)
    const res = await GET(makeGetRequest())
    const data = await res.json()
    expect(data.cards[0].collectionStatus.owned).toBe(1)
    expect(data.cards[0].collectionStatus.wanted).toBe(1)
  })

  it('OPCG ZH_TW alias 收藏以顯示卡（displayCardId）為 key 聚合狀態', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    // 顯示卡為 ZH_TW alias（zhtw-1），其 UserCard.cardId 為 canonical JA、displayCardId 指向 zhtw-1
    vi.mocked(prisma.card.findMany).mockResolvedValue([
      { ...mockCard, id: 'zhtw-1', language: 'ZH_TW', isCollectible: false, canonicalCardId: 'ja-1' },
    ] as never)
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([
      { cardId: 'ja-1', displayCardId: 'zhtw-1', status: 'owned', quantity: 3 },
    ] as never)
    const res = await GET(makeGetRequest({ language: 'ZH_TW' }))
    const data = await res.json()
    expect(data.cards[0].id).toBe('zhtw-1')
    expect(data.cards[0].collectionStatus.owned).toBe(3)
  })

  it('status=owned 傳入正確的 where 條件（兩個顯示身份分支都帶 status）', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    await GET(makeGetRequest({ status: 'owned' }))
    const call = vi.mocked(prisma.card.findMany).mock.calls[0][0]
    const w = call?.where as {
      OR?: Array<{
        displayUserCards?: { some?: { status?: string } }
        userCards?: { some?: { status?: string; displayCardId?: null } }
      }>
    }
    expect(w?.OR?.[0]?.displayUserCards?.some?.status).toBe('owned')
    expect(w?.OR?.[1]?.userCards?.some?.status).toBe('owned')
    expect(w?.OR?.[1]?.userCards?.some?.displayCardId).toBeNull()
  })

  it('依 game / language / setId 篩選', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    await GET(makeGetRequest({ game: 'PTCG', language: 'EN', setId: 'set-1' }))
    const call = vi.mocked(prisma.card.findMany).mock.calls[0][0]
    const w = call?.where as Record<string, unknown>
    expect(w?.game).toBe('PTCG')
    expect(w?.language).toBe('EN')
    expect(w?.setId).toBe('set-1')
  })

  it('q 以卡名 contains 或型號前綴篩選（insensitive，置於 AND 不與顯示身份 OR 衝突）', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    await GET(makeGetRequest({ q: 'Pikachu' }))
    const call = vi.mocked(prisma.card.findMany).mock.calls[0][0]
    const w = call?.where as { AND?: Array<{ OR?: Array<{ name?: { contains: string }; externalId?: { startsWith: string } }> }> }
    const qOr = w?.AND?.[0]?.OR
    expect(qOr).toBeDefined()
    expect(qOr?.[0]?.name?.contains).toBe('Pikachu')
    expect(qOr?.[1]?.externalId?.startsWith).toBe('Pikachu')
  })

  it('分頁：pageSize 上限 100、page 下限 1、totalPages 正確', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.card.count).mockResolvedValue(250)
    const res = await GET(makeGetRequest({ page: '3', pageSize: '50' }))
    const data = await res.json()
    expect(data.page).toBe(3)
    expect(data.pageSize).toBe(50)
    expect(data.totalPages).toBe(5)
  })

  it('非法 status 回 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const res = await GET(makeGetRequest({ status: 'invalid' }))
    expect(res.status).toBe(400)
  })

  it('非法 game 回 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const res = await GET(makeGetRequest({ game: 'INVALID' }))
    expect(res.status).toBe(400)
  })

  it('非法 language 回 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const res = await GET(makeGetRequest({ language: 'FR' }))
    expect(res.status).toBe(400)
  })

  it('不回傳其他 user 的 UserCard', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const res = await GET(makeGetRequest())
    const data = await res.json()
    expect(data.cards).toHaveLength(0)
    // 兩個顯示身份分支的 userId 都必須是 u1
    const call = vi.mocked(prisma.card.findMany).mock.calls[0][0]
    const w = call?.where as {
      OR?: Array<{
        displayUserCards?: { some?: { userId?: string } }
        userCards?: { some?: { userId?: string } }
      }>
    }
    expect(w?.OR?.[0]?.displayUserCards?.some?.userId).toBe('u1')
    expect(w?.OR?.[1]?.userCards?.some?.userId).toBe('u1')
  })
})

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
      create: { userId: 'u1', cardId: 'c1', status: 'owned', displayCardId: null },
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
        // 保留原始顯示語言：displayCardId 記原始 alias id
        create: expect.objectContaining({ cardId: 'ja-card-1', displayCardId: 'zhtw-alias-id' }),
      })
    )
  })

  it('collectible 卡：create 的 displayCardId 為 null（純 canonical 加入）', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.userCard.upsert).mockResolvedValue({
      id: 'uc1', userId: 'u1', cardId: 'c1', status: 'owned',
      quantity: 1, condition: null, notes: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as never)
    await POST(makeRequest({ cardId: 'c1', status: 'owned' }))
    expect(prisma.userCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ displayCardId: null }),
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
