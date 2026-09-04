import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { PATCH } from '../route'
import { prisma } from '@/lib/prisma'

const mockBinder = {
  id: 'b1',
  userId: 'u1',
  name: 'Test',
  gridType: 'grid_3x3',
  coverColor: '#4A5568',
  settings: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeCard(id: string, name: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name,
    imageSmall: `https://example.test/${id}.png`,
    language: 'EN',
    cardNumber: '001',
    rarity: 'Common',
    supertype: 'Pokémon',
    ...overrides,
  }
}

/** 原始（未經 toDisplaySlot 投影）的格位 row，形狀對齊 slotDisplaySelect。 */
function makeRawSlot(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    binderId: 'b1',
    cardId: 'c1',
    displayCardId: null,
    pageNumber: 1,
    slotIndex: 0,
    status: 'owned',
    groupIndex: null,
    group: null,
    card: makeCard('c1', 'Card A'),
    displayCard: null,
    ...overrides,
  }
}

const mockSlots = [
  makeRawSlot(),
  makeRawSlot({ id: 's2', cardId: 'c2', pageNumber: 2, card: makeCard('c2', 'Card B') }),
]

function mockTransactionReturning(slots: unknown[]) {
  vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
    return (fn as (tx: unknown) => unknown)({
      $executeRaw: vi.fn().mockResolvedValue(0),
      binderSlot: { findMany: vi.fn().mockResolvedValue(slots) },
    })
  })
}

function makeRequest(body: unknown) {
  return new Request('http://localhost', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/binders/[id]/pages/reorder-bulk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ newOrder: [2, 1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(401)
  })

  it('非本人 binder 回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' } as never)
    const res = await PATCH(makeRequest({ newOrder: [2, 1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(403)
  })

  it('newOrder 非陣列回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    const res = await PATCH(makeRequest({ newOrder: 'bad' }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(400)
  })

  it('newOrder 不是完整 1..N 排列回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    const res = await PATCH(makeRequest({ newOrder: [1, 3] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(400)
  })

  it('newOrder 有重複頁碼回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    const res = await PATCH(makeRequest({ newOrder: [1, 1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(400)
  })

  it('成功：呼叫 $transaction 並回傳 slots', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    mockTransactionReturning(mockSlots)
    const res = await PATCH(makeRequest({ newOrder: [2, 1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('slots')
    expect(Array.isArray(data.slots)).toBe(true)
  })

  it('成功：單頁 newOrder=[1] 正常回傳', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    mockTransactionReturning([mockSlots[0]])
    const res = await PATCH(makeRequest({ newOrder: [1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(200)
  })
  // ── 顯示身份迴歸（此 route 曾是全站唯一自己寫 select 的格位讀取點） ──────────────

  it('alias 格位以 displayCard 為顯示身份，imageSmall 仍取 canonical', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    mockTransactionReturning([
      makeRawSlot({
        cardId: 'ja-1',
        displayCardId: 'zhtw-1',
        card: makeCard('ja-1', '日文卡名', { language: 'JA' }),
        displayCard: makeCard('zhtw-1', '繁中卡名', { language: 'ZH_TW', imageSmall: '' }),
      }),
    ])

    const res = await PATCH(makeRequest({ newOrder: [1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    const { slots } = await res.json()
    expect(slots[0].card.name).toBe('繁中卡名')
    expect(slots[0].card.language).toBe('ZH_TW')
    expect(slots[0].cardId).toBe('zhtw-1')
    // OPCG ZH_TW alias 無實體印刷圖，圖片一律指向 canonical
    expect(slots[0].card.imageSmall).toBe('https://example.test/ja-1.png')
  })

  it('跨格群組格位回傳 span，不再掉失跨格資訊', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    mockTransactionReturning([
      makeRawSlot({
        groupIndex: 1,
        group: { id: 'g1', cols: 2, rows: 1, rotation: 270, imageUrl: null },
      }),
    ])

    const res = await PATCH(makeRequest({ newOrder: [1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    const { slots } = await res.json()
    expect(slots[0].span).toEqual({
      groupId: 'g1',
      groupIndex: 1,
      cols: 2,
      rows: 1,
      rotation: 270,
      imageUrl: null,
    })
  })

  it('非群組格位的 span 為 null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    mockTransactionReturning([makeRawSlot()])

    const res = await PATCH(makeRequest({ newOrder: [1] }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    const { slots } = await res.json()
    expect(slots[0].span).toBeNull()
  })
})
