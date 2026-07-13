import {
  SITEMAP_CHUNK_SIZE,
  buildSitemapIndex,
  getCardCount,
  sitemapChildPaths,
} from '@/lib/sitemap'

// 無 [id] 路由段，Next 會嘗試在 build 期靜態預渲染（需連 DB）；build 環境（CI）DB 不可達會導致 build 失敗。
// 強制 dynamic 改在 request time 渲染，快取改交給 src/lib/sitemap.ts 的 unstable_cache（86400 秒）負責。
export const dynamic = 'force-dynamic'

export async function GET() {
  const cardCount = await getCardCount()
  const chunkCount = Math.max(1, Math.ceil(cardCount / SITEMAP_CHUNK_SIZE))
  const body = buildSitemapIndex(sitemapChildPaths(chunkCount))
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
