import { describe, it, expect, vi, beforeEach } from 'vitest'
import worker from './worker.js'

// Worker 用 Node 原生 fetch/Request/Response（vitest environment: node，Node 22 內建支援），
// 不需 @cloudflare/vitest-pool-workers——worker.js 未使用任何 CF-only runtime API 之外的東西
// （env binding 為純物件 mock 即可），比照 src/app/api/proxy-image/__tests__/route.test.ts 風格。

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const mockRateLimit = vi.fn()
const env = { IMAGE_PROXY_RATE_LIMITER: { limit: (...args: unknown[]) => mockRateLimit(...args) } }

beforeEach(() => {
  mockFetch.mockReset()
  mockRateLimit.mockReset()
  mockRateLimit.mockResolvedValue({ success: true })
})

function makeRequest(urlParam?: string, headers?: Record<string, string>) {
  const url = urlParam
    ? `https://images.pocketbindr.app/?url=${encodeURIComponent(urlParam)}`
    : 'https://images.pocketbindr.app/'
  return new Request(url, { headers })
}

describe('pocketbindr-image-proxy worker', () => {
  it('cross-origin Referer 一律視為 hotlink 回 403，不呼叫 rate limiter（檢查排在限流前）', async () => {
    const res = await worker.fetch(
      makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png', {
        referer: 'https://evil.example.com/steal',
      }),
      env,
    )
    expect(res.status).toBe(403)
    expect(mockRateLimit).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('缺 Referer/Origin 一律放行（fail-open，保 Googlebot 抓圖）', async () => {
    mockFetch.mockResolvedValue(
      new Response(new ReadableStream(), { status: 200, headers: { 'Content-Type': 'image/png' } }),
    )
    const res = await worker.fetch(
      makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'),
      env,
    )
    expect(res.status).not.toBe(403)
  })

  // 回歸測試：Worker 讀不到 app 端 AUTH_URL，siteOrigin 若寫死單一值會在本機開發（localhost）
  // 誤判為外站 hotlink（實測發現的真實 bug，見 docs/PATTERNS.md「Cloudflare 暖存 proxy」）。
  it('Referer 落在 env.ALLOWED_ORIGINS 清單內（如本機開發 origin）放行', async () => {
    mockFetch.mockResolvedValue(
      new Response(new ReadableStream(), { status: 200, headers: { 'Content-Type': 'image/png' } }),
    )
    const res = await worker.fetch(
      makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png', {
        referer: 'http://localhost:3000/cards',
      }),
      { ...env, ALLOWED_ORIGINS: 'https://pocketbindr.app,http://localhost:3000' },
    )
    expect(res.status).not.toBe(403)
  })

  it('env.ALLOWED_ORIGINS 未設時 fallback 僅正式站，本機 Referer 仍被擋（避免設定漏帶時全開）', async () => {
    const res = await worker.fetch(
      makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png', {
        referer: 'http://localhost:3000/cards',
      }),
      env, // 不含 ALLOWED_ORIGINS
    )
    expect(res.status).toBe(403)
  })

  it('returns 429 when rate limiter rejects', async () => {
    mockRateLimit.mockResolvedValue({ success: false })
    const res = await worker.fetch(
      makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'),
      env,
    )
    expect(res.status).toBe(429)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns 400 when url param is missing', async () => {
    const res = await worker.fetch(makeRequest(), env)
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed URL', async () => {
    const res = await worker.fetch(makeRequest('not-a-url'), env)
    expect(res.status).toBe(400)
  })

  it('returns 403 for non-whitelisted hostname', async () => {
    const res = await worker.fetch(makeRequest('https://example.com/image.png'), env)
    expect(res.status).toBe(403)
  })

  it('proxies a whitelisted URL with CORP + long cache headers', async () => {
    mockFetch.mockResolvedValue(
      new Response(new ReadableStream(), { status: 200, headers: { 'Content-Type': 'image/png' } }),
    )
    const res = await worker.fetch(
      makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'),
      env,
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=604800')
    expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('cross-origin')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://asia-tc.onepiece-cardgame.com/images/card.png',
      expect.objectContaining({ headers: { Referer: 'https://asia-tc.onepiece-cardgame.com' } }),
    )
  })

  it('images.pokemontcg.io 在白名單內，直連不需 Referer 也放行', async () => {
    mockFetch.mockResolvedValue(
      new Response(new ReadableStream(), { status: 200, headers: { 'Content-Type': 'image/png' } }),
    )
    const res = await worker.fetch(makeRequest('https://images.pokemontcg.io/sv3/25.png'), env)
    expect(res.status).toBe(200)
  })

  // 非 2xx 不得被長快取釘死，否則 client 端重試被自己的快取吞掉（比照現行 Vercel route N1 決策）
  it('does not long-cache an upstream error response (N1)', async () => {
    mockFetch.mockResolvedValue(new Response('nope', { status: 404 }))
    const res = await worker.fetch(
      makeRequest('https://asia-tc.onepiece-cardgame.com/images/missing.png'),
      env,
    )
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  // retry 前有短暫延遲（避免緊接著撞上 origin 端節流窗口，見 worker.js 診斷註解），
  // 用 fake timers 跳過真實等待、避免測試變慢。
  it('retries once on upstream network error (after brief delay), then succeeds', async () => {
    vi.useFakeTimers()
    mockFetch
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(
        new Response(new ReadableStream(), { status: 200, headers: { 'Content-Type': 'image/png' } }),
      )
    const resPromise = worker.fetch(
      makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'),
      env,
    )
    await vi.runAllTimersAsync()
    const res = await resPromise
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('returns 502 no-store when upstream keeps failing after retry', async () => {
    vi.useFakeTimers()
    mockFetch.mockRejectedValue(new Error('timeout'))
    const resPromise = worker.fetch(
      makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'),
      env,
    )
    await vi.runAllTimersAsync()
    const res = await resPromise
    expect(res.status).toBe(502)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('missing rate limiter binding does not crash (local dev / config drift safety)', async () => {
    mockFetch.mockResolvedValue(
      new Response(new ReadableStream(), { status: 200, headers: { 'Content-Type': 'image/png' } }),
    )
    const res = await worker.fetch(
      makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'),
      {},
    )
    expect(res.status).toBe(200)
  })
})
