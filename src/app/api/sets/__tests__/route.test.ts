import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cardSet: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  cardsReadIpLimiter: { limit: vi.fn().mockResolvedValue({ success: true }) },
  getClientIp: () => '127.0.0.1',
}))

// unstable_cache 依 Next request-scoped 快取實作，在 Vitest（無 Next 伺服器）環境下直接透傳，
// 讓測試聚焦於查詢與排序邏輯本身；快取行為另以下方「不重打 prisma」案例驗證呼叫次數語意。
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

import { GET, SETS_CACHE_CONTROL } from '../route'
import { prisma } from '@/lib/prisma'

// helper: 建立假的 cardSet 資料
function makeSet(overrides: {
  id?: string
  name?: string
  series?: string
  externalId?: string
  releaseDate?: Date | null
}) {
  return {
    id: overrides.id ?? 'set-1',
    name: overrides.name ?? 'Test Set',
    series: overrides.series ?? 'Series A',
    externalId: overrides.externalId ?? overrides.id ?? 'set-1',
    releaseDate: overrides.releaseDate !== undefined ? overrides.releaseDate : new Date('2024-01-01'),
  }
}

describe('GET /api/sets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('game 未傳入回傳 400，且 no-store', async () => {
    const req = new NextRequest('http://localhost/api/sets')
    const res = await GET(req)
    expect(res.status).toBe(400)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('合法請求回傳 200 並帶上 SETS_CACHE_CONTROL（public、s-maxage=3600）', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/sets?game=PTCG')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe(SETS_CACHE_CONTROL)
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

  it('促銷 set 在其 series group 內排最後', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([
      makeSet({ id: 's1', name: '特典卡 劍&盾', series: 'Sword & Shield', externalId: 'S-P', releaseDate: new Date('2022-12-15') }),
      makeSet({ id: 's2', name: '擴充包「星星誕生」', series: 'Sword & Shield', externalId: 'S9', releaseDate: new Date('2022-01-28') }),
      makeSet({ id: 's3', name: '擴充包「思維激盪」', series: 'Sword & Shield', externalId: 'S12', releaseDate: new Date('2022-11-04') }),
    ] as never)

    const req = new NextRequest('http://localhost/api/sets?game=PTCG')
    const res = await GET(req)
    const data = await res.json()

    const group = data.groups[0]
    expect(group.sets.map((s: { id: string }) => s.id)).toEqual(['s3', 's2', 's1'])
  })

  it('同發售日 set 依 externalId 遞減', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([
      makeSet({ id: 's1', name: 'スタートデッキ A', series: 'One Piece', externalId: 'ST31', releaseDate: new Date('2026-07-11') }),
      makeSet({ id: 's2', name: 'スタートデッキ B', series: 'One Piece', externalId: 'ST32', releaseDate: new Date('2026-07-11') }),
      makeSet({ id: 's3', name: 'スタートデッキ C', series: 'One Piece', externalId: 'ST33', releaseDate: new Date('2026-07-11') }),
    ] as never)

    const req = new NextRequest('http://localhost/api/sets?game=OPCG')
    const res = await GET(req)
    const data = await res.json()

    const group = data.groups[0]
    expect(group.sets.map((s: { externalId: string }) => s.externalId)).toEqual(['ST33', 'ST32', 'ST31'])
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

  it('查詢包在 unstable_cache 內，key 綁定 game/language', async () => {
    const { unstable_cache } = await import('next/cache')
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/sets?game=OPCG&language=JA')
    await GET(req)
    expect(unstable_cache).toHaveBeenCalledWith(
      expect.any(Function),
      ['sets', 'OPCG', 'JA'],
      expect.objectContaining({ revalidate: 3600, tags: ['sets'] }),
    )
  })
})
