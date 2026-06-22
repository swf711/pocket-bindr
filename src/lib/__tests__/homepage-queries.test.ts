import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: { findMany: vi.fn(), count: vi.fn() },
    cardSet: { findMany: vi.fn(), findFirst: vi.fn() },
    userCard: { groupBy: vi.fn() },
  },
}))

vi.mock('@/lib/get-card-image-url', () => ({
  getCardImageUrl: vi.fn((url: string) => url),
}))

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
}))

import {
  getShowcaseCards,
  getLatestSetsByGame,
  getLatestSeriesCards,
  getMostWantedCards,
  getTotalCardCount,
} from '@/lib/homepage-queries'
import { prisma } from '@/lib/prisma'
import { getCardImageUrl } from '@/lib/get-card-image-url'

const mockPrismaCard = {
  id: 'card-1',
  name: 'Charizard ex',
  imageSmall: 'https://images.pokemontcg.io/sv3pt5/54_hires.png',
  imageLarge: 'https://images.pokemontcg.io/sv3pt5/54_hires.png',
  supertype: 'Pokémon',
  rarity: 'Special Illustration Rare',
  hp: 330,
  types: ['Fire'],
  cardNumber: '054',
  isCollectible: true,
  canonicalCardId: null,
  attributes: null,
  set: { id: 'sv3pt5', name: 'Obsidian Flames', series: 'Scarlet & Violet', externalId: 'sv3pt5', releaseDate: new Date('2023-08-11') },
  aliases: [],
}

const mockOpcgCard = {
  ...mockPrismaCard,
  id: 'opcg-1',
  name: 'モンキー・D・ルフィ',
  game: 'OPCG',
  language: 'JA',
  aliases: [{ name: '蒙其·D·魯夫', set: { name: '起始甲板！草帽海賊團' } }],
}

const mockSet = {
  id: 'set-1',
  name: 'Paradox Rift',
  game: 'PTCG' as const,
  language: 'ZH_TW' as const,
  symbolUrl: 'https://example.com/symbol.png',
  releaseDate: new Date('2023-11-03'),
  totalCards: 182,
  externalId: 'sv4',
}

describe('getShowcaseCards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('PTCG ZH_TW：回傳 isCollectible=true 且有圖片的卡牌', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockPrismaCard] as never)

    const result = await getShowcaseCards('PTCG', 'ZH_TW')

    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ game: 'PTCG', language: 'ZH_TW', isCollectible: true }),
      })
    )
    expect(result[0].id).toBe('card-1')
    expect(result[0].collectionStatus).toEqual({ owned: 0, wanted: 0 })
  })

  it('OPCG JA：aliases[0] 映射至 zhName / zhSetName', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockOpcgCard] as never)

    const result = await getShowcaseCards('OPCG', 'JA')

    expect(result[0].zhName).toBe('蒙其·D·魯夫')
    expect(result[0].zhSetName).toBe('起始甲板！草帽海賊團')
  })

  it('無 alias 時 zhName / zhSetName 為 undefined', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockPrismaCard] as never)

    const result = await getShowcaseCards('PTCG', 'ZH_TW')

    expect(result[0].zhName).toBeUndefined()
    expect(result[0].zhSetName).toBeUndefined()
  })

  it('limit 參數正確套用至 take', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([])

    await getShowcaseCards('PTCG', 'ZH_TW', 3)

    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    )
  })

  it('imageSmall 為空時被 where 條件過濾（不回傳）', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([])

    await getShowcaseCards('PTCG', 'ZH_TW')

    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ imageSmall: { not: '' } }),
      })
    )
  })

  it('imageSmall 經 getCardImageUrl 處理', async () => {
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockPrismaCard] as never)
    vi.mocked(getCardImageUrl).mockReturnValue('/api/proxy-image?url=...')

    const result = await getShowcaseCards('PTCG', 'ZH_TW')

    expect(getCardImageUrl).toHaveBeenCalledWith(mockPrismaCard.imageSmall)
    expect(result[0].imageSmall).toBe('/api/proxy-image?url=...')
  })
})

describe('getLatestSetsByGame', () => {
  beforeEach(() => vi.clearAllMocks())

  it('依 game + language 篩選', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([mockSet] as never)

    await getLatestSetsByGame('PTCG', 'ZH_TW')

    expect(prisma.cardSet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ game: 'PTCG', language: 'ZH_TW' }),
      })
    )
  })

  it('releaseDate null 不回傳（where 條件排除）', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([mockSet] as never)

    await getLatestSetsByGame('PTCG', 'ZH_TW')

    expect(prisma.cardSet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ releaseDate: { not: null } }),
      })
    )
  })

  it('排序由新至舊（releaseDate desc）', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([mockSet] as never)

    await getLatestSetsByGame('PTCG', 'ZH_TW')

    expect(prisma.cardSet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { releaseDate: 'desc' } })
    )
  })

  it('預設 limit=6', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([])

    await getLatestSetsByGame('OPCG', 'JA')

    expect(prisma.cardSet.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 6 })
    )
  })

  it('DB 無結果時回傳空陣列', async () => {
    vi.mocked(prisma.cardSet.findMany).mockResolvedValue([])

    const result = await getLatestSetsByGame('PTCG', 'ZH_TW')

    expect(result).toEqual([])
  })
})

describe('getMostWantedCards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('無 wanted UserCard 時回傳空陣列', async () => {
    vi.mocked(prisma.userCard.groupBy).mockResolvedValue([])

    const result = await getMostWantedCards('PTCG', 'ZH_TW', 10)

    expect(result).toEqual([])
    expect(prisma.card.findMany).not.toHaveBeenCalled()
  })

  it('依 game + language + isCollectible 篩選 Card', async () => {
    vi.mocked(prisma.userCard.groupBy).mockResolvedValue([
      { cardId: 'c1', _count: { cardId: 5 } },
    ] as never)
    vi.mocked(prisma.card.findMany).mockResolvedValue([
      { ...mockPrismaCard, id: 'c1', aliases: [] },
    ] as never)

    await getMostWantedCards('PTCG', 'ZH_TW', 10)

    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          game: 'PTCG',
          language: 'ZH_TW',
          isCollectible: true,
        }),
      })
    )
  })

  it('wantedCount 依 groupBy count 正確排序', async () => {
    vi.mocked(prisma.userCard.groupBy).mockResolvedValue([
      { cardId: 'c1', _count: { cardId: 3 } },
      { cardId: 'c2', _count: { cardId: 7 } },
    ] as never)
    vi.mocked(prisma.card.findMany).mockResolvedValue([
      { ...mockPrismaCard, id: 'c1', name: 'Card A', aliases: [] },
      { ...mockPrismaCard, id: 'c2', name: 'Card B', aliases: [] },
    ] as never)

    const result = await getMostWantedCards('PTCG', 'ZH_TW', 10)

    expect(result[0].wantedCount).toBe(7)
    expect(result[0].name).toBe('Card B')
    expect(result[1].wantedCount).toBe(3)
  })

  it('OPCG 回傳結果帶入 alias zhName / zhSetName', async () => {
    vi.mocked(prisma.userCard.groupBy).mockResolvedValue([
      { cardId: 'opcg-1', _count: { cardId: 2 } },
    ] as never)
    vi.mocked(prisma.card.findMany).mockResolvedValue([
      {
        ...mockPrismaCard,
        id: 'opcg-1',
        name: 'モンキー・D・ルフィ',
        aliases: [{ name: '蒙其·D·魯夫', set: { name: '起始甲板！草帽海賊團' } }],
      },
    ] as never)

    const result = await getMostWantedCards('OPCG', 'JA', 10)

    expect(result[0].zhName).toBe('蒙其·D·魯夫')
    expect(result[0].zhSetName).toBe('起始甲板！草帽海賊團')
  })
})

describe('getTotalCardCount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('回傳 isCollectible=true 的卡牌數', async () => {
    vi.mocked(prisma.card.count).mockResolvedValue(68000 as never)

    const result = await getTotalCardCount()

    expect(prisma.card.count).toHaveBeenCalledWith({ where: { isCollectible: true } })
    expect(result).toBe(68000)
  })

  it('DB 回傳 0 時正確傳遞', async () => {
    vi.mocked(prisma.card.count).mockResolvedValue(0 as never)
    const result = await getTotalCardCount()
    expect(result).toBe(0)
  })
})

describe('getLatestSeriesCards', () => {
  beforeEach(() => vi.clearAllMocks())

  const mockLatestSet = { id: 'set-latest' }

  it('找到最新系列並回傳指定數量的卡牌', async () => {
    vi.mocked(prisma.cardSet.findFirst).mockResolvedValue(mockLatestSet as never)
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockPrismaCard] as never)

    const result = await getLatestSeriesCards('PTCG', 'ZH_TW', 2)

    expect(prisma.cardSet.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ game: 'PTCG', language: 'ZH_TW', releaseDate: { not: null } }),
        orderBy: { releaseDate: 'desc' },
      })
    )
    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ setId: 'set-latest', isCollectible: true }),
        take: 2,
      })
    )
    expect(result).toHaveLength(1)
  })

  it('無符合系列時回傳空陣列', async () => {
    vi.mocked(prisma.cardSet.findFirst).mockResolvedValue(null as never)

    const result = await getLatestSeriesCards('PTCG', 'EN', 2)

    expect(result).toEqual([])
    expect(prisma.card.findMany).not.toHaveBeenCalled()
  })

  it('回傳的卡牌 imageSmall 不為空（where 條件）', async () => {
    vi.mocked(prisma.cardSet.findFirst).mockResolvedValue(mockLatestSet as never)
    vi.mocked(prisma.card.findMany).mockResolvedValue([])

    await getLatestSeriesCards('PTCG', 'ZH_TW', 2)

    expect(prisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ imageSmall: { not: '' } }),
      })
    )
  })

  it('OPCG JA 卡牌含 zhName（有 alias 的情況）', async () => {
    vi.mocked(prisma.cardSet.findFirst).mockResolvedValue(mockLatestSet as never)
    vi.mocked(prisma.card.findMany).mockResolvedValue([mockOpcgCard] as never)

    const result = await getLatestSeriesCards('OPCG', 'JA', 4)

    expect(result[0].zhName).toBe('蒙其·D·魯夫')
  })
})
