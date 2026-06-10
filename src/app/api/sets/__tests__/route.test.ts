import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cardSet: { findMany: vi.fn() },
  },
}))

import { GET } from '../route'
import { prisma } from '@/lib/prisma'

describe('GET /api/sets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('game 未傳入時回傳 400', async () => {
    const req = new NextRequest('http://localhost/api/sets')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('未傳 language 時預設以 EN 篩選', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/sets?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.cardSet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { game: 'PTCG', language: 'EN' },
      })
    )
  })

  it('language=ZH_TW 時以 ZH_TW 篩選', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/sets?game=PTCG&language=ZH_TW')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.cardSet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { game: 'PTCG', language: 'ZH_TW' },
      })
    )
    const data = await res.json()
    expect(data).toHaveProperty('sets')
  })

  it('language 值無效時回傳 400', async () => {
    const req = new NextRequest('http://localhost/api/sets?game=PTCG&language=xx')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('language must be one of EN, JA, ZH_TW')
    expect(prisma.cardSet.findMany).not.toHaveBeenCalled()
  })
})
