import { NextRequest, NextResponse } from 'next/server'
import { PROXY_HOSTNAMES } from '@/lib/get-card-image-url'
import { proxyImageIpLimiter } from '@/lib/rate-limit'

const API_WHITELIST = [...PROXY_HOSTNAMES, 'images.pokemontcg.io']

// 官網來源偶發慢/掛時，避免 serverless function 一路掛到平台逾時（比照 src/lib/og.ts 的
// fetchImageDataUri 對 OG render path 的處理，runtime 圖片路徑同型補上）。
const UPSTREAM_TIMEOUT_MS = 5000
const UPSTREAM_RETRIES = 1
const LONG_CACHE = 'public, max-age=604800, s-maxage=86400'

/** 逾時/網路錯誤重試 UPSTREAM_RETRIES 次；非 2xx 不在此重試（交由呼叫端依 status 決定，見下方 N1 快取分流）。 */
async function fetchUpstream(url: string, headers: HeadersInit): Promise<Response> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= UPSTREAM_RETRIES; attempt++) {
    try {
      return await fetch(url, { headers, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) })
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success } = await proxyImageIpLimiter.limit(ip)
  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const rawUrl = req.nextUrl.searchParams.get('url')
  if (!rawUrl) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  if (!API_WHITELIST.includes(parsed.hostname)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  let upstream: Response
  try {
    upstream = await fetchUpstream(rawUrl, { Referer: parsed.origin })
  } catch {
    // 逾時/網路錯誤（含重試後仍失敗）：回 502 且不快取，讓 client 端 CardImage 能重試恢復
    return new NextResponse('Bad Gateway', {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg'

  // N1：只有成功回應才長快取；上游錯誤（4xx/5xx）一律 no-store，否則錯誤回應會被瀏覽器/CDN
  // 快取釘死，使 CardImage 的 client 端重試被自己的快取靜默吞掉。
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': upstream.ok ? LONG_CACHE : 'no-store',
    },
  })
}
