import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    card: { findMany: vi.fn(), count: vi.fn() },
    userCard: { findMany: vi.fn() },
  },
}))
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}))

import { GET } from '../route'
import { prisma } from '@/lib/prisma'

describe('GET /api/cards', () => {
  beforeEach(() => vi.clearAllMocks())

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
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('cards')
    expect(data).toHaveProperty('totalPages')
    expect(data).toHaveProperty('page', 1)
    expect(data).toHaveProperty('pageSize', 20)
  })
})
