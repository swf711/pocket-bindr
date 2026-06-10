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

  it('language 值無效時回傳 400', async () => {
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=INVALID')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('language must be one of EN, JA, ZH_TW')
  })

  it('language=JA 時 where 條件包含 language: JA', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG&language=JA')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ game: 'PTCG', language: 'JA' }),
      })
    )
    expect(prisma.card.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ language: 'JA' }),
    })
  })

  it('未傳 language 時 where 條件預設為 EN', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])
    const req = new NextRequest('http://localhost/api/cards?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ language: 'EN' }),
      })
    )
  })
})
