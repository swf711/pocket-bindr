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
  return new Request('http://localhost/api/binders/b1/slots/remove-empty', {
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

describe('POST /api/binders/[id]/slots/remove-empty', () => {
  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 1 }), context)
    expect(res.status).toBe(401)
  })

  it('卡冊不存在回傳 404', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(null)
    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 1 }), context)
    expect(res.status).toBe(404)
  })

  it('非本人卡冊回傳 403', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' } as never)
    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 1 }), context)
    expect(res.status).toBe(403)
  })

  it('body 缺欄位回傳 400', async () => {
    const res = await POST(makeRequest({ pageNumber: 1 }), context)
    expect(res.status).toBe(400)
  })

  it('成功往前遞補並回傳 movedSlotIds，且不動 UserCard', async () => {
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([
      slot(1, 0), slot(1, 2), slot(1, 3), slot(1, 6),
    ] as never)
    const calls = captureTx()

    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 1 }), context)
    expect(res.status).toBe(200)
    const data = await res.json()
    // index 4、5 為空，故 index 6 的卡不受影響
    expect(data.movedSlotIds).toEqual(['p1s2', 'p1s3'])
    expect(data.totalPages).toBe(1)
    expect(calls.rawStatements).toHaveLength(2)
    expect(calls.userCardTouched).toBe(false)
  })

  it('目標格有卡則視為 noop，不做任何寫入', async () => {
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([slot(1, 0), slot(1, 1)] as never)
    const calls = captureTx()

    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 0 }), context)
    expect(res.status).toBe(200)
    expect((await res.json()).movedSlotIds).toEqual([])
    expect(calls.rawStatements).toEqual([])
  })

  it('空格之後沒有卡可遞補也是 noop', async () => {
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([slot(1, 0)] as never)
    const calls = captureTx()

    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 4 }), context)
    expect(res.status).toBe(200)
    expect((await res.json()).movedSlotIds).toEqual([])
    expect(calls.rawStatements).toEqual([])
  })

  it('撞跨格群組且未帶 groupMode 回傳 409 insertBlockedByGroup', async () => {
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([
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

  it('移除空格不會增頁：totalPages 維持不變', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({
      ...mockBinder,
      settings: { totalPages: 3 },
    } as never)
    vi.mocked(prisma.binderSlot.findMany).mockResolvedValue([slot(1, 1), slot(1, 2)] as never)
    const calls = captureTx()

    const res = await POST(makeRequest({ pageNumber: 1, slotIndex: 0 }), context)
    expect(res.status).toBe(200)
    expect((await res.json()).totalPages).toBe(3)
    expect(calls.binderUpdates).toEqual([])
  })
})
