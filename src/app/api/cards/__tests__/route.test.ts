import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: { findMany: vi.fn(), count: vi.fn() },
    cardSet: { findMany: vi.fn() },
    userCard: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

const mockBuildCrossLangExpansion = vi.fn()
vi.mock('@/lib/cross-language-search', () => ({
  buildCrossLangExpansion: (...args: unknown[]) => mockBuildCrossLangExpansion(...args),
}))

vi.mock('@/lib/rate-limit', () => ({
  cardsSearchIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  getClientIp: () => '127.0.0.1',
}))

import { GET } from '../route'
import { prisma } from '@/lib/prisma'

// 無 setId 路徑：route 會先 cardSet.findMany 取得排序，再 $queryRaw 取分頁卡 id，最後 card.findMany(byIds)。
// 預設讓這條鏈回傳空，個別測試需要資料時再覆寫 $queryRaw + card.findMany。
function resetDefaults() {
  vi.mocked(prisma.cardSet.findMany).mockResolvedValue([] as never)
  vi.mocked(prisma.$queryRaw).mockResolvedValue([] as never)
  vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
  vi.mocked(prisma.card.count).mockResolvedValue(0)
  mockBuildCrossLangExpansion.mockResolvedValue({ nameTerms: [], cardIds: [] })
}

// 設定「無 setId」路徑回傳單張卡
function mockSingleCard(card: { id: string } & Record<string, unknown>) {
  vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: card.id }] as never)
  vi.mocked(prisma.card.findMany).mockResolvedValue([card] as never)
  vi.mocked(prisma.card.count).mockResolvedValue(1)
}

describe('GET /api/cards', () => {
  beforeEach(() => { vi.clearAllMocks(); resetDefaults() })

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

  it('language=JA 時 count 的 where 條件包含 language: JA', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=JA')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ game: 'PTCG', language: 'JA' }),
    })
  })

  it('未傳 language 時 where 條件預設為 EN', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ language: 'EN' }),
    })
  })

  it('未登入時每張卡的 collectionStatus 均為 { owned: null, wanted: null }', async () => {
    mockAuth.mockResolvedValue(null)
    mockSingleCard({ id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } })
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards[0].collectionStatus).toEqual({ owned: null, wanted: null })
    expect(prisma.userCard.findMany).not.toHaveBeenCalled()
  })

  it('登入用戶有 owned 記錄時 collectionStatus.owned 為 quantity 值', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    mockSingleCard({ id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } })
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
    mockSingleCard({ id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } })
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
    mockSingleCard({ id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } })
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

  it('登入用戶無任何收藏記錄的卡牌 collectionStatus 均為 null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    mockSingleCard({ id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } })
    vi.mocked(prisma.userCard.findMany).mockResolvedValue([] as never)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards[0].collectionStatus).toEqual({ owned: null, wanted: null })
  })
})

describe('GET /api/cards - OPCG ZH_TW alias canonicalization', () => {
  beforeEach(() => { vi.clearAllMocks(); resetDefaults() })

  it('OPCG+ZH_TW alias 卡：collectionStatus 查 canonicalCardId 而非 alias id', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    mockSingleCard({
      id: 'zhtw-c1', name: '魯夫', imageSmall: '', rarity: null, cardNumber: 'OP01-001',
      isCollectible: false, canonicalCardId: 'ja-c1', set: { name: 'OP-01' },
    })
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
    mockSingleCard({
      id: 'tw-limited-c1', name: '台灣限定卡', imageSmall: '', rarity: null, cardNumber: 'P-136',
      isCollectible: true, canonicalCardId: null, set: { name: 'ZH-TW Limited' },
    })
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
  beforeEach(() => { vi.clearAllMocks(); resetDefaults() })

  it('Prisma 拋出錯誤時回傳 500 JSON', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.count).mockRejectedValue(new Error('DB connection failed'))
    const req = new NextRequest('http://localhost/api/cards?game=OPCG&language=ZH_TW')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })
})

describe('GET /api/cards - externalId prefix search', () => {
  beforeEach(() => { vi.clearAllMocks(); resetDefaults() })

  it('有關鍵字時 count 的 where 條件包含 name contains 和 externalId startsWith 的 OR', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=pikachu')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [
          { name: { contains: 'pikachu', mode: 'insensitive' } },
          { externalId: { startsWith: 'pikachu', mode: 'insensitive' } },
        ],
      }),
    })
  })

  it('q=OP15 時 externalId startsWith 條件被帶入（OP15 也觸發 set-only pattern，OR 有 3 個條件）', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards?game=OPCG&q=OP15')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          { name: { contains: 'OP15', mode: 'insensitive' } },
          { externalId: { startsWith: 'OP15', mode: 'insensitive' } },
        ]),
      }),
    })
  })

  it('未傳 q 時 where 條件不包含 OR', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.not.objectContaining({ OR: expect.anything() }),
    })
  })

  it('keyword + language + setId 組合篩選時所有條件都被帶入 where（單一系列走 card.findMany）', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
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

describe('GET /api/cards - set code + 卡號格式搜尋（PTCG）', () => {
  beforeEach(() => { vi.clearAllMocks(); resetDefaults() })

  it('q=sv8-001 有 setId 時，findMany where.OR 包含第三個 set externalId 條件', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=sv8-001&setId=en-sv8')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'sv8-001', mode: 'insensitive' } },
            { externalId: { startsWith: 'sv8-001', mode: 'insensitive' } },
            expect.objectContaining({
              set: { externalId: { equals: 'sv8', mode: 'insensitive' } },
            }),
          ]),
        }),
      })
    )
    // OR 應有三個條件（name + externalId + set card pattern）
    const call = vi.mocked(prisma.card.findMany).mock.calls[0][0] as { where: { OR: unknown[] } }
    expect(call.where.OR).toHaveLength(3)
  })

  it('q=sv8-001 無 setId 時，card.count where.OR 也包含 set card pattern 條件', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=sv8-001')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          { name: { contains: 'sv8-001', mode: 'insensitive' } },
          { externalId: { startsWith: 'sv8-001', mode: 'insensitive' } },
          expect.objectContaining({
            set: { externalId: { equals: 'sv8', mode: 'insensitive' } },
          }),
        ]),
      }),
    })
    const countCall = vi.mocked(prisma.card.count).mock.calls[0][0] as { where: { OR: unknown[] } }
    expect(countCall.where.OR).toHaveLength(3)
  })

  it('q=sv8-001 無 setId 時，$queryRaw 被呼叫且 values 包含 setCode "sv8"', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=sv8-001')
    await GET(req)
    expect(prisma.$queryRaw).toHaveBeenCalled()
    const sqlArg = vi.mocked(prisma.$queryRaw).mock.calls[0][0] as { values: unknown[] }
    expect(sqlArg.values).toEqual(expect.arrayContaining(['sv8']))
  })

  it('q=pikachu 不觸發 set code pattern，OR 只有原本兩個條件', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=pikachu&setId=set1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const call = vi.mocked(prisma.card.findMany).mock.calls[0][0] as { where: { OR: unknown[] } }
    expect(call.where.OR).toHaveLength(2)
  })

  it('q=sv8（set-only）有 setId 時，findMany where.OR 包含第三個純 set filter 條件（無 OR 子條件）', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=sv8&setId=set1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const call = vi.mocked(prisma.card.findMany).mock.calls[0][0] as { where: { OR: unknown[] } }
    // sv8 觸發 set-only pattern → OR 有 3 個條件（name + externalId + set filter）
    expect(call.where.OR).toHaveLength(3)
    // 第三個條件只有 set filter，無 OR 子條件
    const thirdCondition = call.where.OR[2] as Record<string, unknown>
    expect(thirdCondition).toHaveProperty('set')
    expect(thirdCondition).not.toHaveProperty('OR')
  })

  it('q=sv8（set-only）無 setId 時，card.count where.OR 包含 set-only 條件', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=sv8')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          { name: { contains: 'sv8', mode: 'insensitive' } },
          { externalId: { startsWith: 'sv8', mode: 'insensitive' } },
          { set: { externalId: { equals: 'sv8', mode: 'insensitive' } } },
        ]),
      }),
    })
  })

  it('q 為空時 where 不包含 OR（回歸）', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.not.objectContaining({ OR: expect.anything() }),
    })
  })
})

describe('GET /api/cards - 跨語言展開', () => {
  beforeEach(() => { vi.clearAllMocks(); resetDefaults() })

  it('PTCG JA + q=皮卡丘 → findMany where.OR 含展開的 ピカチュウ 比對詞（有 setId 路徑）', async () => {
    mockAuth.mockResolvedValue(null)
    mockBuildCrossLangExpansion.mockResolvedValue({ nameTerms: ['ピカチュウ'], cardIds: [] })
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=JA&q=皮卡丘&setId=set1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ name: { contains: 'ピカチュウ', mode: 'insensitive' } }]),
        }),
      })
    )
  })

  it('PTCG JA + q=皮卡丘 → 無 setId 路徑的 $queryRaw SQL 含展開比對詞', async () => {
    mockAuth.mockResolvedValue(null)
    mockBuildCrossLangExpansion.mockResolvedValue({ nameTerms: ['ピカチュウ'], cardIds: [] })
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=JA&q=皮卡丘')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const sqlArg = vi.mocked(prisma.$queryRaw).mock.calls[0][0] as { strings: string[]; values: unknown[] }
    expect(sqlArg.strings.join('')).toContain('ILIKE')
    expect(sqlArg.values).toEqual(expect.arrayContaining(['%ピカチュウ%']))
  })

  it('OPCG JA + q=魯夫 → findMany where.OR 含 id IN (canonicalIds)（有 setId 路徑）', async () => {
    mockAuth.mockResolvedValue(null)
    mockBuildCrossLangExpansion.mockResolvedValue({ nameTerms: [], cardIds: ['ja-op01-001'] })
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/cards?game=OPCG&language=JA&q=魯夫&setId=set1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ id: { in: ['ja-op01-001'] } }]),
        }),
      })
    )
  })

  it('OPCG JA + q=魯夫 → 無 setId 路徑的 $queryRaw SQL 含 id = ANY(canonicalIds)', async () => {
    mockAuth.mockResolvedValue(null)
    mockBuildCrossLangExpansion.mockResolvedValue({ nameTerms: [], cardIds: ['ja-op01-001'] })
    const req = new NextRequest('http://localhost/api/cards?game=OPCG&language=JA&q=魯夫')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const sqlArg = vi.mocked(prisma.$queryRaw).mock.calls[0][0] as { strings: string[]; values: unknown[] }
    expect(sqlArg.strings.join('')).toContain('= ANY(')
    expect(sqlArg.values).toEqual(expect.arrayContaining([['ja-op01-001']]))
  })

  it('展開結果為空時（無字典命中）查詢與現狀一致，不額外加 OR 條件（回歸保護）', async () => {
    mockAuth.mockResolvedValue(null)
    mockBuildCrossLangExpansion.mockResolvedValue({ nameTerms: [], cardIds: [] })
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=JA&q=abcxyz')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [
          { name: { contains: 'abcxyz', mode: 'insensitive' } },
          { externalId: { startsWith: 'abcxyz', mode: 'insensitive' } },
        ],
      }),
    })
  })
})
