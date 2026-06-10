import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userCard: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { POST } from '../route'
import { prisma } from '@/lib/prisma'

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/collection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/collection', () => {
  beforeEach(() => vi.clearAllMocks())

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
      create: { userId: 'u1', cardId: 'c1', status: 'owned' },
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
})
