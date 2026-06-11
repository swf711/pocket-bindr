import { NextRequest, NextResponse } from 'next/server'
import { PROXY_HOSTNAMES } from '@/lib/get-card-image-url'

const API_WHITELIST = [...PROXY_HOSTNAMES, 'images.pokemontcg.io']

export async function GET(req: NextRequest) {
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

  const upstream = await fetch(rawUrl, {
    headers: { Referer: parsed.origin },
  })

  const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg'

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=604800, s-maxage=86400',
    },
  })
}
