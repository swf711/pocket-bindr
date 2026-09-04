import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn() },
    binderSlot: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))

const mockRevalidate = vi.fn()
vi.mock('@/lib/binder-cache', () => ({
  revalidatePublicBinder: (token: string | null) => mockRevalidate(token),
}))

import { PATCH } from '../route'
import { prisma } from '@/lib/prisma'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/binders/b1/slots/s1/labels', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const context = { params: Promise.resolve({ id: 'b1', slotId: 's1' }) }
const makeContext = (id = 'b1', slotId = 's1') => ({ params: Promise.resolve({ id, slotId }) })

const mockBinder = {
  id: 'b1',
  userId: 'u1',
  name: 'Test Binder',
  gridType: 'grid_3x3' as const,
  coverColor: '#4A5568',
  description: null,
  settings: null,
  sortOrder: 0,
  shareToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const filledSlot = {
  id: 's1',
  binderId: 'b1',
  cardId: 'c1',
  displayCardId: null,
  status: 'owned' as const,
  pageNumber: 1,
  slotIndex: 0,
  createdAt: new Date(),
  groupId: null,
  groupIndex: null,
  labels: [],
}

describe('PATCH /api/binders/[id]/slots/[slotId]/labels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder)
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue(filledSlot)
    vi.mocked(prisma.binderSlot.update).mockResolvedValue(filledSlot)
  })

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ labels: ['x'] }), context)
    expect(res.status).toBe(401)
  })

  it('非本人卡冊回傳 403', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' })
    const res = await PATCH(makeRequest({ labels: ['x'] }), context)
    expect(res.status).toBe(403)
  })

  it('卡冊不存在回傳 404', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(null)
    const res = await PATCH(makeRequest({ labels: ['x'] }), context)
    expect(res.status).toBe(404)
  })

  it('slot 不屬於該 binder 回傳 404', async () => {
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue({ ...filledSlot, binderId: 'other' })
    const res = await PATCH(makeRequest({ labels: ['x'] }), context)
    expect(res.status).toBe(404)
  })

  it('空格位（無卡）回傳 400', async () => {
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue({
      ...filledSlot,
      cardId: null,
      status: null,
    })
    const res = await PATCH(makeRequest({ labels: ['x'] }), context)
    expect(res.status).toBe(400)
  })

  it('單一標籤超過長度上限回傳 400 SLOT_LABEL_TOO_LONG', async () => {
    const res = await PATCH(makeRequest({ labels: ['123456789'] }), context)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('SLOT_LABEL_TOO_LONG')
    expect(prisma.binderSlot.update).not.toHaveBeenCalled()
  })

  it('超過數量上限回傳 400 SLOT_LABELS_TOO_MANY', async () => {
    const res = await PATCH(makeRequest({ labels: ['a', 'b', 'c', 'd'] }), context)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('SLOT_LABELS_TOO_MANY')
    expect(prisma.binderSlot.update).not.toHaveBeenCalled()
  })

  it('成功寫入多個標籤並回傳 { slotId, labels }', async () => {
    const res = await PATCH(makeRequest({ labels: [' No.025 ', 'SR'] }), context)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ slotId: 's1', labels: ['No.025', 'SR'] })
    expect(prisma.binderSlot.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { labels: ['No.025', 'SR'] },
    })
  })

  it('空白與重複項在寫入前被正規化掉', async () => {
    const res = await PATCH(makeRequest({ labels: ['SR', ' SR ', '  ', 'RR'] }), context)
    expect(await res.json()).toEqual({ slotId: 's1', labels: ['SR', 'RR'] })
  })

  it('labels 傳空陣列 → 清除全部', async () => {
    const res = await PATCH(makeRequest({ labels: [] }), context)
    expect(await res.json()).toEqual({ slotId: 's1', labels: [] })
    expect(prisma.binderSlot.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { labels: [] },
    })
  })

  it('群組成員的 slotId → 寫到 anchor，回傳 anchor 的 slotId', async () => {
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue({
      ...filledSlot,
      id: 's2',
      groupId: 'g1',
      groupIndex: 1,
    })
    vi.mocked(prisma.binderSlot.findFirst).mockResolvedValue({ id: 'anchor1' } as never)

    const res = await PATCH(makeRequest({ labels: ['A'] }), makeContext('b1', 's2'))
    expect(await res.json()).toEqual({ slotId: 'anchor1', labels: ['A'] })
    expect(prisma.binderSlot.update).toHaveBeenCalledWith({
      where: { id: 'anchor1' },
      data: { labels: ['A'] },
    })
  })

  it('anchor 自己（groupIndex 0）不再多查一次', async () => {
    vi.mocked(prisma.binderSlot.findUnique).mockResolvedValue({
      ...filledSlot,
      groupId: 'g1',
      groupIndex: 0,
    })
    await PATCH(makeRequest({ labels: ['A'] }), context)
    expect(prisma.binderSlot.findFirst).not.toHaveBeenCalled()
  })

  it('有 shareToken 時呼叫 revalidatePublicBinder', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, shareToken: 'tok' })
    await PATCH(makeRequest({ labels: ['A'] }), context)
    expect(mockRevalidate).toHaveBeenCalledWith('tok')
  })
})
