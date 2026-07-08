import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubGlobal('fetch', vi.fn())

import { fetchSets, fetchCardsBySet } from '@/lib/ptcg'

const mockSet = {
  id: 'sv1',
  name: 'Scarlet & Violet',
  series: 'Scarlet & Violet',
  printedTotal: 198,
  total: 258,
  releaseDate: '2023/03/31',
  images: {
    symbol: 'https://images.pokemontcg.io/sv1/symbol.png',
    logo: 'https://images.pokemontcg.io/sv1/logo.png',
  },
}

const mockCard = {
  id: 'sv1-1',
  name: 'Sprigatito',
  supertype: 'Pokémon',
  subtypes: ['Basic'],
  hp: '70',
  types: ['Grass'],
  set: { id: 'sv1' },
  number: '1',
  rarity: 'Common',
  images: {
    small: 'https://images.pokemontcg.io/sv1/1.png',
    large: 'https://images.pokemontcg.io/sv1/1_hires.png',
  },
}

describe('fetchSets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('呼叫正確的 API 端點', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [mockSet],
        page: 1,
        pageSize: 250,
        count: 1,
        totalCount: 1,
      }),
    } as Response)

    const sets = await fetchSets()

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/v2/sets'))
    expect(sets).toHaveLength(1)
    expect(sets[0].id).toBe('sv1')
  })

  it('自動處理分頁，拉取所有資料', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [mockSet],
        page: 1,
        pageSize: 1,
        count: 1,
        totalCount: 2,
      }),
    } as Response)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ ...mockSet, id: 'sv2' }],
        page: 2,
        pageSize: 1,
        count: 1,
        totalCount: 2,
      }),
    } as Response)

    const sets = await fetchSets()
    expect(sets).toHaveLength(2)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

describe('fetchCardsBySet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('以 set.id 為條件查詢', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [mockCard],
        page: 1,
        pageSize: 250,
        count: 1,
        totalCount: 1,
      }),
    } as Response)

    const cards = await fetchCardsBySet('sv1')

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('q=set.id%3Asv1'))
    expect(cards).toHaveLength(1)
    expect(cards[0].id).toBe('sv1-1')
  })
})
