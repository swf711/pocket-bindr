import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { PATCH } from '../route'
import { prisma } from '@/lib/prisma'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/binders/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/binders/reorder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ orderedIds: ['a'] }))
    expect(res.status).toBe(401)
  })

  it('orderedIds 非陣列回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const res = await PATCH(makeRequest({ orderedIds: 'not-array' }))
    expect(res.status).toBe(400)
  })

  it('orderedIds 為空陣列回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    const res = await PATCH(makeRequest({ orderedIds: [] }))
    expect(res.status).toBe(400)
  })

  it('orderedIds 含非本人卡冊回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findMany).mockResolvedValue([
      { id: 'b1', userId: 'u2' },
    ] as never)
    const res = await PATCH(makeRequest({ orderedIds: ['b1'] }))
    expect(res.status).toBe(403)
  })

  it('orderedIds 含不存在的卡冊 id 回傳 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findMany).mockResolvedValue([] as never)
    const res = await PATCH(makeRequest({ orderedIds: ['b-nonexist'] }))
    expect(res.status).toBe(400)
  })

  it('成功重排：呼叫 $transaction 更新 sortOrder，回傳 { ok: true }', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    vi.mocked(prisma.binder.findMany).mockResolvedValue([
      { id: 'b1', userId: 'u1' },
      { id: 'b2', userId: 'u1' },
    ] as never)
    vi.mocked(prisma.$transaction).mockResolvedValue([])
    const res = await PATCH(makeRequest({ orderedIds: ['b2', 'b1'] }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ ok: true })
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })
})
