import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

const mockIpLimit = vi.fn()
vi.mock('@/lib/rate-limit', () => ({
  proxyImageIpLimiter: { limit: () => mockIpLimit() },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
  mockIpLimit.mockReset()
  mockIpLimit.mockResolvedValue({ success: true })
})

function makeRequest(urlParam?: string) {
  const url = urlParam
    ? `http://localhost/api/proxy-image?url=${encodeURIComponent(urlParam)}`
    : 'http://localhost/api/proxy-image'
  return new NextRequest(url)
}

describe('GET /api/proxy-image', () => {
  it('returns 429 when the IP rate limit is exceeded', async () => {
    mockIpLimit.mockResolvedValue({ success: false })
    const res = await GET(makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'))
    expect(res.status).toBe(429)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns 400 when url param is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed URL', async () => {
    const res = await GET(makeRequest('not-a-url'))
    expect(res.status).toBe(400)
  })

  it('returns 403 for non-whitelisted hostname', async () => {
    const res = await GET(makeRequest('https://example.com/image.png'))
    expect(res.status).toBe(403)
  })

  it('proxies a whitelisted URL with correct headers', async () => {
    const fakeBody = new ReadableStream()
    mockFetch.mockResolvedValue(
      new Response(fakeBody, {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      })
    )

    const res = await GET(makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=604800, s-maxage=86400')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://asia-tc.onepiece-cardgame.com/images/card.png',
      expect.objectContaining({ headers: { Referer: 'https://asia-tc.onepiece-cardgame.com' } })
    )
  })

  // N1：上游錯誤（4xx/5xx）不得被長快取釘死，否則 client 端重試被自己的快取吞掉
  it('does not long-cache an upstream error response (N1)', async () => {
    mockFetch.mockResolvedValue(new Response('nope', { status: 404 }))

    const res = await GET(makeRequest('https://asia-tc.onepiece-cardgame.com/images/missing.png'))
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(res.headers.get('Cache-Control')).not.toContain('max-age')
  })

  it('429 rate-limit response is not cached', async () => {
    mockIpLimit.mockResolvedValue({ success: false })
    const res = await GET(makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'))
    expect(res.status).toBe(429)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  // N2：逾時/網路錯誤時重試一次
  it('retries once on upstream network error, then succeeds (N2)', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(
        new Response(new ReadableStream(), {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        })
      )

    const res = await GET(makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'))
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=604800, s-maxage=86400')
  })

  it('returns 502 no-store when upstream keeps failing after retry (N2)', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'))

    const res = await GET(makeRequest('https://asia-tc.onepiece-cardgame.com/images/card.png'))
    expect(res.status).toBe(502)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
