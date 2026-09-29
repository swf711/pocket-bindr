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

const mockLimit = vi.fn().mockResolvedValue({ success: true })
vi.mock('@/lib/rate-limit', () => ({
  cardsSearchIpLimiter: { limit: (...args: unknown[]) => mockLimit(...args) },
  getClientIp: () => '127.0.0.1',
}))

import { GET, CARDS_CACHE_CONTROL } from '../route'
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





})

describe('GET /api/cards - OPCG ZH_TW alias canonicalization', () => {
  beforeEach(() => { vi.clearAllMocks(); resetDefaults() })



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

  it('keyword + language + setId 組合篩選時所有條件都被帶入 where（單一系列走 card.count）', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=eevee&language=EN&setId=set123')
    const res = await GET(req)
    expect(res.status).toBe(200)
    // 有卡號優先排序需要表達式，兩分支都改走 $queryRaw 取 id；完整 where 現由 count 收。
    expect(prisma.card.count).toHaveBeenCalledWith(
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

  it('q=sv8-001 有 setId 時，count where.OR 包含第三個 set externalId 條件', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=sv8-001&setId=en-sv8')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith(
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
    const call = vi.mocked(prisma.card.count).mock.calls[0][0] as { where: { OR: unknown[] } }
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
    const call = vi.mocked(prisma.card.count).mock.calls[0][0] as { where: { OR: unknown[] } }
    expect(call.where.OR).toHaveLength(2)
  })

  it('q=sv8（set-only）有 setId 時，count where.OR 包含第三個純 set filter 條件（無 OR 子條件）', async () => {
    mockAuth.mockResolvedValue(null)
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&q=sv8&setId=set1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const call = vi.mocked(prisma.card.count).mock.calls[0][0] as { where: { OR: unknown[] } }
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

  it.each([
    ['有 setId（單一系列）', 'http://localhost/api/cards?game=PTCG&setId=ja-DP5'],
    ['無 setId（全系列）', 'http://localhost/api/cards?game=PTCG'],
  ])('%s：ORDER BY 以 NULLIF 把無卡號卡推到最後（有卡號優先）', async (_label, url) => {
    // Postgres 的 '' 小於所有非空字串，直接 ORDER BY "cardNumber" ASC 會讓無卡號卡佔滿第一頁
    // （ja-DP5 有 55 張無卡號卡，實測前 12 張全是）。
    mockAuth.mockResolvedValue(null)
    await GET(new NextRequest(url))
    const sql = (vi.mocked(prisma.$queryRaw).mock.calls[0][0] as { strings: string[] }).strings.join('?')
    expect(sql).toContain(`NULLIF("cardNumber", '') ASC NULLS LAST`)
    expect(sql).not.toContain('"cardNumber" ASC,')
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

  it('PTCG JA + q=皮卡丘 → count where.OR 含展開的 ピカチュウ 比對詞（有 setId 路徑）', async () => {
    mockAuth.mockResolvedValue(null)
    mockBuildCrossLangExpansion.mockResolvedValue({ nameTerms: ['ピカチュウ'], cardIds: [] })
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=JA&q=皮卡丘&setId=set1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith(
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

  it('OPCG JA + q=魯夫 → count where.OR 含 id IN (canonicalIds)（有 setId 路徑）', async () => {
    mockAuth.mockResolvedValue(null)
    mockBuildCrossLangExpansion.mockResolvedValue({ nameTerms: [], cardIds: ['ja-op01-001'] })
    vi.mocked(prisma.card.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(0)
    const req = new NextRequest('http://localhost/api/cards?game=OPCG&language=JA&q=魯夫&setId=set1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.count).toHaveBeenCalledWith(
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

describe('GET /api/cards - enum cast 索引正確性（回歸守門）', () => {
  beforeEach(() => { vi.clearAllMocks(); resetDefaults() })

  // raw SQL 必須 cast「參數」（"game" = $1::"Game"）而非「欄位」（"game"::text = $1）。
  // 後者會讓複合索引 Card_game_language_externalId_key 失效退化 Seq Scan。
  it('無 setId 的 $queryRaw：game/language 以參數 cast（::"Game" / ::"Language"），非欄位 ::text', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=JA')
    await GET(req)
    expect(prisma.$queryRaw).toHaveBeenCalled()
    const sqlArg = vi.mocked(prisma.$queryRaw).mock.calls[0][0] as { strings: string[]; values: unknown[] }
    const sql = sqlArg.strings.join('')
    // 參數 cast（正確：索引可用）
    expect(sql).toContain('::"Game"')
    expect(sql).toContain('::"Language"')
    // 欄位 cast（錯誤：退化 Seq Scan）—— 必須不存在
    expect(sql).not.toContain('"game"::text')
    expect(sql).not.toContain('"language"::text')
    // enum 值仍作為 bound parameter，非字面拼接
    expect(sqlArg.values).toEqual(expect.arrayContaining(['PTCG', 'JA']))
  })

  it('無 setId 時回傳 cards 順序依 $queryRaw 的 pageIds（排序行為不變）', async () => {
    mockAuth.mockResolvedValue(null)
    // $queryRaw 決定順序 c2 → c1
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: 'c2' }, { id: 'c1' }] as never)
    // findMany 刻意回傳相反順序，驗證 route 以 pageIds 還原
    vi.mocked(prisma.card.findMany).mockResolvedValue([
      { id: 'c1', name: 'A', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'S' } },
      { id: 'c2', name: 'B', imageSmall: '', rarity: null, cardNumber: '002', set: { name: 'S' } },
    ] as never)
    vi.mocked(prisma.card.count).mockResolvedValue(2)
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=JA')
    const res = await GET(req)
    const data = await res.json()
    expect(data.cards.map((c: { id: string }) => c.id)).toEqual(['c2', 'c1'])
  })
  // 🔴 這些斷言守住「回應可掛 public 交給 CDN」的前提：只要 collectionStatus 之類的
  // user-specific 欄位回到這個端點，CDN 就會把某個使用者的收藏狀態餵給其他人。
  it('回應不含任何 user-specific 欄位，且完全不查收藏資料', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    mockSingleCard({ id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } })
    const res = await GET(new NextRequest('http://localhost/api/cards?game=PTCG'))
    const data = await res.json()
    expect(data.cards[0]).not.toHaveProperty('collectionStatus')
    expect(prisma.userCard.findMany).not.toHaveBeenCalled()
  })

  it('登入與未登入的回應內容完全相同', async () => {
    mockSingleCard({ id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } })
    mockAuth.mockResolvedValue(null)
    const anon = await (await GET(new NextRequest('http://localhost/api/cards?game=PTCG'))).json()
    mockSingleCard({ id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } })
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const authed = await (await GET(new NextRequest('http://localhost/api/cards?game=PTCG'))).json()
    expect(authed).toEqual(anon)
  })

  it('掛上可共享的 Cache-Control，且 s-maxage 與內層 unstable_cache 同壽命', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/cards?game=PTCG'))
    expect(res.headers.get('Cache-Control')).toBe(CARDS_CACHE_CONTROL)
    expect(CARDS_CACHE_CONTROL).toMatch(/^public,/)
    expect(CARDS_CACHE_CONTROL).toContain('s-maxage=60')
  })

  it('被限流時回 no-store，不讓 429 進共享快取', async () => {
    mockLimit.mockResolvedValueOnce({ success: false })
    const res = await GET(new NextRequest('http://localhost/api/cards?game=PTCG'))
    expect(res.status).toBe(429)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  describe('分頁參數驗證', () => {
    it('page 非數字回 400、no-store（原本 parseInt("abc") 靜默產生 NaN）', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await GET(new NextRequest('http://localhost/api/cards?game=PTCG&page=abc'))
      expect(res.status).toBe(400)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
    })

    it('page=0 回 400', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await GET(new NextRequest('http://localhost/api/cards?game=PTCG&page=0'))
      expect(res.status).toBe(400)
    })

    it('page=-1 回 400', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await GET(new NextRequest('http://localhost/api/cards?game=PTCG&page=-1'))
      expect(res.status).toBe(400)
    })

    it('pageSize=1.5 回 400', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await GET(new NextRequest('http://localhost/api/cards?game=PTCG&pageSize=1.5'))
      expect(res.status).toBe(400)
    })

    it('pageSize 非數字回 400', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await GET(new NextRequest('http://localhost/api/cards?game=PTCG&pageSize=xyz'))
      expect(res.status).toBe(400)
    })

    it('pageSize=200 維持既有 clamp 成 100（不改既有契約）', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await GET(new NextRequest('http://localhost/api/cards?game=PTCG&pageSize=200'))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.pageSize).toBe(100)
    })

    it('q 超過 100 字回 400 query too long', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await GET(new NextRequest(`http://localhost/api/cards?game=PTCG&q=${'a'.repeat(101)}`))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('query too long')
    })

    it('q 剛好 100 字仍合法', async () => {
      mockAuth.mockResolvedValue(null)
      const res = await GET(new NextRequest(`http://localhost/api/cards?game=PTCG&q=${'a'.repeat(100)}`))
      expect(res.status).toBe(200)
    })

    it('合法 page/pageSize 回應結構不變、不含 collectionStatus', async () => {
      mockAuth.mockResolvedValue(null)
      mockSingleCard({ id: 'card1', name: 'Pikachu', imageSmall: '', rarity: null, cardNumber: '001', set: { name: 'Base' } })
      const res = await GET(new NextRequest('http://localhost/api/cards?game=PTCG&page=2&pageSize=10'))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.page).toBe(2)
      expect(data.pageSize).toBe(10)
      expect(data.cards[0]).not.toHaveProperty('collectionStatus')
    })
  })
})
