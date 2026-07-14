import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveOgImageFetch, fetchImageDataUri, SITE_URL } from '../og'

describe('resolveOgImageFetch', () => {
  it('proxy 相對路徑 /api/proxy-image?url=X 還原成 upstream X，不再指向 SITE_URL', () => {
    const upstream = 'https://images.pokemontcg.io/sv3/25.png'
    const result = resolveOgImageFetch(`/api/proxy-image?url=${encodeURIComponent(upstream)}`)
    expect(result).toEqual({ url: upstream, headers: {} })
  })

  it('官網 host（PROXY_HOSTNAMES）補上 Referer = 該 host origin', () => {
    const result = resolveOgImageFetch('https://asia.pokemon-card.com/tw/card-img/tw00001391.png')
    expect(result).toEqual({
      url: 'https://asia.pokemon-card.com/tw/card-img/tw00001391.png',
      headers: { Referer: 'https://asia.pokemon-card.com' },
    })
  })

  it('proxy 相對路徑指向官網 host 時，還原後同樣補上 Referer', () => {
    const upstream = 'https://www.onepiece-cardgame.com/images/cardlist/card/OP16-001.png'
    const result = resolveOgImageFetch(`/api/proxy-image?url=${encodeURIComponent(upstream)}`)
    expect(result).toEqual({ url: upstream, headers: { Referer: 'https://www.onepiece-cardgame.com' } })
  })

  it('Supabase Storage 絕對 URL 原樣直連、不帶 Referer', () => {
    const upstream = 'https://xacmjvesdmlfpgjmauvr.supabase.co/storage/v1/object/public/card-images/ja/PMCG1/008.webp'
    const result = resolveOgImageFetch(upstream)
    expect(result).toEqual({ url: upstream, headers: {} })
  })

  it('DB 原始官網絕對 URL（分享頁形式，未經 getCardImageUrl）同樣補上 Referer', () => {
    const upstream = 'https://www.pokemon-card.com/some/card.png'
    const result = resolveOgImageFetch(upstream)
    expect(result).toEqual({ url: upstream, headers: { Referer: 'https://www.pokemon-card.com' } })
  })

  it('proxy 相對路徑缺少 url 參數回 null', () => {
    expect(resolveOgImageFetch('/api/proxy-image')).toBeNull()
  })

  it('無法解析的 URL 回 null', () => {
    expect(resolveOgImageFetch('not a url')).toBeNull()
  })

  it('SITE_URL 為 server-only 常數，不受本測試影響', () => {
    expect(typeof SITE_URL).toBe('string')
  })
})

describe('fetchImageDataUri', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('成功回 data URI（content-type 取自 response header，PNG/JPEG/GIF 直接內嵌不經轉檔）', async () => {
    const bytes = new Uint8Array([1, 2, 3])
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: async () => bytes.buffer,
    } as unknown as Response)

    const result = await fetchImageDataUri('https://images.pokemontcg.io/sv3/25.png')
    expect(result).toBe(`data:image/png;base64,${Buffer.from(bytes).toString('base64')}`)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('WebP（Satori 不支援，會讓整個 render 斷線崩潰）→ 回 null 優雅降級，不轉檔、不 throw', async () => {
    // runtime 刻意不引入 sharp 等原生解碼器（在 serverless 會於 module load 階段炸掉整站）；
    // 正解是資料層不產出 webp，此 guard 僅為最後防線。
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/webp' }),
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    } as unknown as Response)

    await expect(fetchImageDataUri('https://xxx.supabase.co/card.webp')).resolves.toBeNull()
  })

  it('不支援的格式不浪費 retry（格式問題重試也不會變成支援的格式）', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/avif' }),
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    } as unknown as Response)

    await expect(fetchImageDataUri('https://xxx.supabase.co/card.avif')).resolves.toBeNull()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('首次拋錯、retry 成功 → 回 data URI', async () => {
    const bytes = new Uint8Array([9, 9])
    vi.mocked(global.fetch)
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: async () => bytes.buffer,
      } as unknown as Response)

    const result = await fetchImageDataUri('https://images.pokemontcg.io/sv3/25.png')
    expect(result).toBe(`data:image/png;base64,${Buffer.from(bytes).toString('base64')}`)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('兩次皆失敗（拋錯）→ 回 null，不 throw', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('network error'))

    await expect(fetchImageDataUri('https://images.pokemontcg.io/sv3/25.png')).resolves.toBeNull()
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('非 2xx → retry 後仍非 2xx → 回 null', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      headers: new Headers(),
      arrayBuffer: async () => new ArrayBuffer(0),
    } as unknown as Response)

    await expect(fetchImageDataUri('https://images.pokemontcg.io/sv3/25.png')).resolves.toBeNull()
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('URL 無法解析（resolveOgImageFetch 回 null）→ 直接回 null，不呼叫 fetch', async () => {
    await expect(fetchImageDataUri('not a url')).resolves.toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
