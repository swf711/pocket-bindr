import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: { findMany: vi.fn() },
    cardSet: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/get-card-image-url', () => ({
  getCardImageUrl: vi.fn((url: string) => url),
}))

import { getFeaturedCards, getLatestSets } from '@/lib/homepage-queries'
import { prisma } from '@/lib/prisma'
import { getCardImageUrl } from '@/lib/get-card-image-url'

const mockCard = {
  id: 'card-1',
  name: 'Charizard ex',
  imageSmall: 'https://images.pokemontcg.io/sv3pt5/54.png',
  rarity: 'Special Illustration Rare',
  set: { name: 'Paradox Rift' },
}

const mockSet = {
  id: 'set-1',
  name: 'Paradox Rift',
  game: 'PTCG' as const,
  language: 'EN' as const,
  symbolUrl: 'https://images.pokemontcg.io/sv4/symbol.png',
  releaseDate: new Date('2023-11-03'),
  totalCards: 182,
  externalId: 'sv4',
}

describe('getFeaturedCards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('回傳最多 8 張卡，且每張均有 imageSmall', async () => {
    const cards = Array.from({ length: 8 }, (_, i) => ({ ...mockCard, id: `card-${i}` }))
    vi.mocked(prisma.card.findMany).mockResolvedValue(cards as never)

    const result = await getFeaturedCards()

    expect(result).toHaveLength(8)
    result.forEach((c) => expect(c.imageSmall).toBeTruthy())
  })

  it('僅查詢 PTCG EN isCollectible=true 的卡牌', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockCard] as never)

    await getFeaturedCards()

    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          game: 'PTCG',
          language: 'EN',
          isCollectible: true,
        }),
      })
    )
  })

  it('imageSmall 經 getCardImageUrl 處理', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockCard] as never)
    vi.mocked(getCardImageUrl).mockReturnValue('/api/proxy-image?url=...')

    const result = await getFeaturedCards()

    expect(getCardImageUrl).toHaveBeenCalledWith(mockCard.imageSmall)
    expect(result[0].imageSmall).toBe('/api/proxy-image?url=...')
  })

  it('pokemontcg.io CDN 不走 proxy，直接回傳原 URL', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockCard] as never)
    vi.mocked(getCardImageUrl).mockReturnValue(mockCard.imageSmall)

    const result = await getFeaturedCards()

    expect(result[0].imageSmall).toBe(mockCard.imageSmall)
  })

  it('DB 無符合條件卡牌時回傳空陣列，不丟例外', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([])

    const result = await getFeaturedCards()

    expect(result).toEqual([])
  })
})

describe('getLatestSets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('依 releaseDate DESC 排序，且查詢排除 null releaseDate', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([mockSet] as never)

    await getLatestSets()

    expect(prisma.cardSet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { releaseDate: { not: null } },
        orderBy: { releaseDate: 'desc' },
      })
    )
  })

  it('預設 limit=6，查詢 take=6', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([mockSet] as never)

    await getLatestSets()

    expect(prisma.cardSet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 6 })
    )
  })

  it('limit 參數可自訂', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([mockSet] as never)

    await getLatestSets(3)

    expect(prisma.cardSet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    )
  })

  it('回傳結果包含正確欄位，releaseDate 為 Date 物件', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([mockSet] as never)

    const result = await getLatestSets()

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'set-1',
      name: 'Paradox Rift',
      game: 'PTCG',
      language: 'EN',
      totalCards: 182,
      externalId: 'sv4',
    })
    expect(result[0].releaseDate).toBeInstanceOf(Date)
  })

  it('DB 無結果時回傳空陣列', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([])

    const result = await getLatestSets()

    expect(result).toEqual([])
  })
})
