import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubGlobal('fetch', vi.fn())

import { fetchSets, fetchCardsBySet, PTCG_FETCH_RETRIES } from '@/lib/ptcg'
import { afterEach } from 'vitest'

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

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/v2/sets'), expect.anything())
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

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('q=set.id%3Asv1'), expect.anything())
    expect(cards).toHaveLength(1)
    expect(cards[0].id).toBe('sv1-1')
  })
})

/**
 * 上游於 2026-08 進入間歇性 5xx 狀態（單發成功率一度僅約 35%），零重試的舊寫法
 * 會讓單發沒中即整批失敗。以下測試守住重試行為。
 */
describe('fetchAllPages 重試行為', () => {
  const okResponse = (data: unknown[]) =>
    ({
      ok: true,
      json: async () => ({ data, page: 1, pageSize: 250, count: data.length, totalCount: data.length }),
    }) as Response

  const errorResponse = (status: number) => ({ ok: false, status }) as Response

  beforeEach(() => {
    vi.clearAllMocks()
    // 退避用真實 setTimeout（次數用盡累計約 15s）；假時鐘快轉，測試不必真的等
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  /** 啟動請求後把假時鐘推過所有退避，讓重試迴圈跑完 */
  function runPastBackoff<T>(start: () => Promise<T>): Promise<T> {
    const promise = start()
    const settled = promise.then(
      value => ({ value }),
      error => ({ error }),
    )
    return vi.advanceTimersByTimeAsync(300_000).then(() => settled.then(() => promise))
  }

  it('遇到 5xx 會重試，後續成功即正常回傳', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(okResponse([mockSet]))

    const sets = await runPastBackoff(fetchSets)

    expect(sets).toHaveLength(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('網路錯誤（含逾時）同樣重試', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('The operation was aborted due to timeout'))
      .mockResolvedValueOnce(okResponse([mockSet]))

    const sets = await runPastBackoff(fetchSets)

    expect(sets).toHaveLength(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('重試次數用盡後 throw，錯誤訊息維持既有契約', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse(500))

    await expect(runPastBackoff(fetchSets)).rejects.toThrow('API error: 500')
    // 1 次初次嘗試 + PTCG_FETCH_RETRIES 次重試
    expect(fetch).toHaveBeenCalledTimes(1 + PTCG_FETCH_RETRIES)
  })

  it('4xx 屬永久錯誤，立即放棄不重試', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse(404))

    await expect(runPastBackoff(fetchSets)).rejects.toThrow('API error: 404')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('429 視為可重試（限流非永久錯誤）', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(okResponse([mockSet]))

    const sets = await runPastBackoff(fetchSets)

    expect(sets).toHaveLength(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
