import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn() },
    binderSlot: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { PATCH } from '../route'
import { prisma } from '@/lib/prisma'

const mockBinder = { id: 'b1', userId: 'u1', name: 'Test', gridType: 'grid_3x3', settings: null, createdAt: new Date(), updatedAt: new Date() }
const slotA = { id: 'sA', binderId: 'b1', pageNumber: 1, slotIndex: 0, cardId: 'c1', status: 'owned', createdAt: new Date() }
const slotB = { id: 'sB', binderId: 'b1', pageNumber: 1, slotIndex: 2, cardId: 'c2', status: 'owned', createdAt: new Date() }

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/binders/[id]/slots/swap', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ slotAId: 'sA', slotBId: 'sB' }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(401)
  })

  it('他人卡冊回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({ ...mockBinder, userId: 'other' } as never)
    const res = await PATCH(makeRequest({ slotAId: 'sA', slotBId: 'sB' }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(403)
  })

  it('slot 不屬於此 binder 回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binderSlot.findUnique)
      .mockResolvedValueOnce({ ...slotA, binderId: 'other-binder' } as never)
      .mockResolvedValueOnce(slotB as never)
    const res = await PATCH(makeRequest({ slotAId: 'sA', slotBId: 'sB' }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(403)
  })

  it('正確交換兩個 slot 的 pageNumber + slotIndex', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    vi.mocked(prisma.binderSlot.findUnique)
      .mockResolvedValueOnce(slotA as never)
      .mockResolvedValueOnce(slotB as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const updatedA = { id: 'sA', pageNumber: slotB.pageNumber, slotIndex: slotB.slotIndex }
      const updatedB = { id: 'sB', pageNumber: slotA.pageNumber, slotIndex: slotA.slotIndex }
      await fn({ binderSlot: { update: vi.fn() } } as never)
      return [updatedA, updatedB]
    })
    const res = await PATCH(makeRequest({ slotAId: 'sA', slotBId: 'sB' }), {
      params: Promise.resolve({ id: 'b1' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.slotA.pageNumber).toBe(slotB.pageNumber)
    expect(data.slotA.slotIndex).toBe(slotB.slotIndex)
    expect(data.slotB.pageNumber).toBe(slotA.pageNumber)
    expect(data.slotB.slotIndex).toBe(slotA.slotIndex)
  })
})
