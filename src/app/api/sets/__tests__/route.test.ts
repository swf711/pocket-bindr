import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cardSet: { findMany: vi.fn() },
  },
}))

import { GET } from '../route'
import { prisma } from '@/lib/prisma'

// helper: 建立假的 cardSet 資料
function makeSet(overrides: {
  id?: string
  name?: string
  series?: string
  releaseDate?: Date | null
}) {
  return {
    id: overrides.id ?? 'set-1',
    name: overrides.name ?? 'Test Set',
    series: overrides.series ?? 'Series A',
    releaseDate: overrides.releaseDate !== undefined ? overrides.releaseDate : new Date('2024-01-01'),
  }
}

describe('GET /api/sets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('game 未傳入回傳 400', async () => {
    const req = new NextRequest('http://localhost/api/sets')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('language 未傳入時預設 EN', async () => {
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

  it('回傳依 series 分組的系列，Group 依最新發售日排序', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([
      makeSet({ id: 's1', series: 'Scarlet & Violet', releaseDate: new Date('2024-06-01') }),
      makeSet({ id: 's2', series: 'Sun & Moon',       releaseDate: new Date('2018-01-01') }),
      makeSet({ id: 's3', series: 'Scarlet & Violet', releaseDate: new Date('2024-01-01') }),
    ] as never)

    const req = new NextRequest('http://localhost/api/sets?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()

    expect(data).toHaveProperty('groups')
    const groups: { series: string; latestRelease: string | null; sets: unknown[] }[] = data.groups

    // 兩個 series
    expect(groups).toHaveLength(2)

    // Scarlet & Violet 比較新，應排在第一
    expect(groups[0].series).toBe('Scarlet & Violet')
    expect(groups[1].series).toBe('Sun & Moon')
  })

  it('group 內的 sets 依 releaseDate 由新到舊排序', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([
      makeSet({ id: 's1', series: 'Scarlet & Violet', releaseDate: new Date('2024-06-01') }),
      makeSet({ id: 's2', series: 'Scarlet & Violet', releaseDate: new Date('2024-01-01') }),
      makeSet({ id: 's3', series: 'Scarlet & Violet', releaseDate: new Date('2023-09-01') }),
    ] as never)

    const req = new NextRequest('http://localhost/api/sets?game=PTCG')
    const res = await GET(req)
    const data = await res.json()

    const group = data.groups[0]
    expect(group.sets).toHaveLength(3)
    // sets 依 releaseDate 由新到舊（Prisma orderBy: releaseDate desc 保持順序）
    expect(group.sets[0].id).toBe('s1')
    expect(group.sets[1].id).toBe('s2')
    expect(group.sets[2].id).toBe('s3')
  })

  it('language=ZH_TW 時以 ZH_TW 篩選並回傳 { groups }', async () => {
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
    expect(data).toHaveProperty('groups')
  })
})
