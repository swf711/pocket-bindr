import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

function makeRequest(urlParam?: string) {
  const url = urlParam
    ? `http://localhost/api/proxy-image?url=${encodeURIComponent(urlParam)}`
    : 'http://localhost/api/proxy-image'
  return new NextRequest(url)
}

describe('GET /api/proxy-image', () => {
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
})
