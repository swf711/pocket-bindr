import {
  SITEMAP_CACHE_CONTROL,
  STATIC_ROUTES,
  buildUrlSet,
  cardChunkToPaths,
  getCardChunk,
  getCardCount,
  parseSitemapChildId,
  SITEMAP_CHUNK_SIZE,
} from '@/lib/sitemap'

// 有 [id] 路由段，天然 dynamic render，不會被 build 期靜態預渲染（無需 force-dynamic）。
// DB 查詢的快取由 src/lib/sitemap.ts 的 unstable_cache（86400 秒）負責，此處不重複宣告 revalidate；
// 但 XML 字串組裝是純 CPU、每次請求照跑，故另以 Cache-Control 讓 CDN 直接回應、連 invocation 都省。
const XML_HEADERS = {
  'Content-Type': 'application/xml',
  'Cache-Control': SITEMAP_CACHE_CONTROL,
} as const

// 錯誤回應不得進共享快取，比照 src/app/api/proxy-image/route.ts 的既有語意。
const NOT_FOUND_HEADERS = { 'Cache-Control': 'no-store' } as const

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const target = parseSitemapChildId(id)
  if (!target) return new Response(null, { status: 404, headers: NOT_FOUND_HEADERS })

  if (target.kind === 'static') {
    return new Response(buildUrlSet(STATIC_ROUTES), { headers: XML_HEADERS })
  }

  const cardCount = await getCardCount()
  const chunkCount = Math.max(1, Math.ceil(cardCount / SITEMAP_CHUNK_SIZE))
  if (target.index < 0 || target.index >= chunkCount) {
    return new Response(null, { status: 404, headers: NOT_FOUND_HEADERS })
  }

  const rows = await getCardChunk(target.index)
  return new Response(buildUrlSet(cardChunkToPaths(rows)), { headers: XML_HEADERS })
}
