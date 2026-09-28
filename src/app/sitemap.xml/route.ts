import {
  SITEMAP_CACHE_CONTROL,
  SITEMAP_CHUNK_SIZE,
  buildSitemapIndex,
  getCardCount,
  sitemapChildPaths,
} from '@/lib/sitemap'

// 無 [id] 路由段，Next 會嘗試在 build 期靜態預渲染（需連 DB）；build 環境（CI）DB 不可達會導致 build 失敗。
// 強制 dynamic 改在 request time 渲染，快取改交給 src/lib/sitemap.ts 的 unstable_cache（86400 秒）負責。
export const dynamic = 'force-dynamic'

// 開關已設時卡片頁已搬到子網域，index 只列 static.xml，不需查卡片總數。
const CARD_PAGES_ORIGIN = process.env.NEXT_PUBLIC_CARD_PAGES_ORIGIN

export async function GET() {
  const chunkCount = CARD_PAGES_ORIGIN
    ? 0
    : Math.max(1, Math.ceil((await getCardCount()) / SITEMAP_CHUNK_SIZE))
  const body = buildSitemapIndex(sitemapChildPaths(chunkCount))
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  })
}
