import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn(), update: vi.fn() },
    binderSlot: { findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    binderSlotGroup: { findMany: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/lib/binder-cache', () => ({ revalidatePublicBinder: vi.fn() }))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import { MAX_PAGES_PER_BINDER } from '@/lib/binder-limits'

const mockBinder = {
  id: 'b1',
  userId: 'u1',
  name: 'Test Binder',
  gridType: 'grid_3x3' as const,
  coverColor: '#4A5568',
  description: null,
  settings: { totalPages: 1 },
  sortOrder: 0,
  shareToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/binders/b1/slots/insert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const context = { params: Promise.resolve({ id: 'b1' }) }

/** 收集 transaction 內對 tx 的呼叫，供斷言實際寫入行為 */
function captureTx() {
  const calls = {
    slotUpdates: [] as { id: string; data: Record<string, unknown> }[],
    rawStatements: [] as string[],
    slotDeleteMany: [] as Record<string, unknown>[],
    slotUpdateMany: [] as Record<string, unknown>[],
    groupDeleteMany: [] as Record<string, unknown>[],
    binderUpdates: [] as Record<string, unknown>[],
    userCardTouched: false,
  }
  const tx = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $executeRaw: vi.fn(async (strings: TemplateStringsArray, ..._values: any[]) => {
      calls.rawStatements.push(strings.join('?').replace(/\s+/g, ' ').trim())
      return 1
    }),
    binderSlot: {
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        calls.slotUpdates.push({ id: where.id, data })
      }),
      updateMany: vi.fn(async (args: Record<string, unknown>) => { calls.slotUpdateMany.push(args) }),
      deleteMany: vi.fn(async (args: Record<string, unknown>) => { calls.slotDeleteMany.push(args) }),
    },
    binderSlotGroup: {
      deleteMany: vi.fn(async (args: Record<string, unknown>) => { calls.groupDeleteMany.push(args) }),
    },
    binder: {
      update: vi.fn(async (args: Record<string, unknown>) => { calls.binderUpdates.push(args) }),
    },
    userCard: {
      update: vi.fn(async () => { calls.userCardTouched = true }),
      updateMany: vi.fn(async () => { calls.userCardTouched = true }),
      deleteMany: vi.fn(async () => { calls.userCardTouched = true }),
      upsert: vi.fn(async () => { calls.userCardTouched = true }),
    },
  }
  vi.mocked(prisma.$transaction).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (async (fn: any) => fn(tx)) as any,
  )
  return calls
}

/** 3×3 grid：以 (page, index) 產生已填卡格位 */
function slot(pageNumber: number, slotIndex: number, extra: Record<string, unknown> = {}) {
  return { id: `p${pageNumber}s${slotIndex}`, pageNumber, slotIndex, groupId: null, groupIndex: null, ...extra }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: 'u1' } })
  vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
  vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([] as never)
  vi.mocked(prisma.binderSlotGroup.findMany).mockResolvedValue([] as never)
})

describe('POST /api/binders/[id]/slots/insert', () => {
  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 0 }), context)
    expect(res.status).toBe(401)
  })

  it('卡冊不存在回傳 404', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(null)
    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 0 }), context)
    expect(res.status).toBe(404)
  })

  it('非本人卡冊回傳 403', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' } as never)
    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 0 }), context)
    expect(res.status).toBe(403)
  })

  it('body 缺欄位回傳 400', async () => {
    const res = await POST(makeRequest({ pageNumber: 1 }), context)
    expect(res.status).toBe(400)
  })

  it('slotIndex 超出格線範圍回傳 400', async () => {
    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 9 }), context)
    expect(res.status).toBe(400)
  })

  it('成功位移並回傳 movedSlotIds / totalPages，且不動 UserCard', async () => {
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([
      slot(1, 0), slot(1, 1), slot(1, 2), slot(1, 4),
    ] as never)
    const calls = captureTx()

    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 1 }), context)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.movedSlotIds).toEqual(['p1s1', 'p1s2'])
    expect(data.totalPages).toBe(1)

    // 兩段式：先全部挪到暫時座標（負 pageNumber），再一次落位
    expect(calls.rawStatements).toHaveLength(2)
    expect(calls.rawStatements[0]).toContain('SET "pageNumber" = -"pageNumber"')
    expect(calls.rawStatements[1]).toContain('FROM (VALUES')
    expect(calls.userCardTouched).toBe(false)
  })

  it('位移格數再多也只發 2 個 UPDATE（不隨 N 線性成長）', async () => {
    // 3×3 × 5 頁全滿 = 45 格，插入第 1 格 → 44 格要位移
    const full = Array.from({ length: 5 }, (_, page) =>
      Array.from({ length: 9 }, (_, i) => slot(page + 1, i)),
    ).flat()
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({
      ...mockBinder,
      settings: { totalPages: 5 },
    } as never)
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue(full as never)
    const calls = captureTx()

    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 0 }), context)
    expect(res.status).toBe(200)
    expect((await res.json()).movedSlotIds).toHaveLength(45)
    expect(calls.rawStatements).toHaveLength(2)
    // 逐格 update 是被本次效能修正淘汰的舊寫法，不得復辟
    expect(calls.slotUpdates).toHaveLength(0)
  })

  it('插入點是空格則不做任何寫入', async () => {
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([slot(1, 0)] as never)
    const calls = captureTx()

    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 5 }), context)
    expect(res.status).toBe(200)
    expect((await res.json()).movedSlotIds).toEqual([])
    expect(calls.rawStatements).toEqual([])
  })

  it('全滿時自動增頁並同步 settings.totalPages', async () => {
    const full = Array.from({ length: 9 }, (_, i) => slot(1, i))
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue(full as never)
    const calls = captureTx()

    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 8 }), context)
    expect(res.status).toBe(200)
    expect((await res.json()).totalPages).toBe(2)
    expect(calls.binderUpdates).toEqual([
      { where: { id: 'b1' }, data: { settings: { totalPages: 2 } } },
    ])
  })

  it('撞頁數上限回傳 409 pageLimitReached', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({
      ...mockBinder,
      settings: { totalPages: MAX_PAGES_PER_BINDER },
    } as never)
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([
      slot(MAX_PAGES_PER_BINDER, 7),
      slot(MAX_PAGES_PER_BINDER, 8),
    ] as never)

    const res = await POST(makeRequest({ pageNumber: MAX_PAGES_PER_BINDER, slotIndex: 7 }), context)
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('pageLimitReached')
  })

  it('撞跨格群組且未帶 groupMode 回傳 409 insertBlockedByGroup', async () => {
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([
      slot(1, 0),
      slot(1, 1, { groupId: 'grp', groupIndex: 0 }),
      slot(1, 2, { groupId: 'grp', groupIndex: 1 }),
    ] as never)
    vi.mocked(prisma.binderSlotGroup.findMany).mockResolvedValue([
      { id: 'grp', cols: 2, rows: 1 },
    ] as never)

    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 0 }), context)
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('insertBlockedByGroup')
    expect(data.groupIds).toEqual(['grp'])
  })

  it('groupMode=collapse 刪除非 anchor 成員並拆掉群組，不動 UserCard', async () => {
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([
      slot(1, 0),
      slot(1, 1, { groupId: 'grp', groupIndex: 0 }),
      slot(1, 2, { groupId: 'grp', groupIndex: 1 }),
    ] as never)
    vi.mocked(prisma.binderSlotGroup.findMany).mockResolvedValue([
      { id: 'grp', cols: 2, rows: 1 },
    ] as never)
    const calls = captureTx()

    const res = await POST(
      makeRequest({ pageNumber: 1, slotIndex: 0, groupMode: 'collapse' }),
      context,
    )
    expect(res.status).toBe(200)
    expect((await res.json()).removedSlotIds).toEqual(['p1s2'])
    expect(calls.slotDeleteMany[0]).toMatchObject({
      where: { binderId: 'b1', id: { in: ['p1s2'] } },
    })
    expect(calls.groupDeleteMany[0]).toMatchObject({
      where: { binderId: 'b1', id: { in: ['grp'] } },
    })
    expect(calls.userCardTouched).toBe(false)
  })
})
