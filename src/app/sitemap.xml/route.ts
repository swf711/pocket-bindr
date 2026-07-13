import {
  SITEMAP_CHUNK_SIZE,
  buildSitemapIndex,
  getCardCount,
  sitemapChildPaths,
} from '@/lib/sitemap'

export const revalidate = 86400

export async function GET() {
  const cardCount = await getCardCount()
  const chunkCount = Math.max(1, Math.ceil(cardCount / SITEMAP_CHUNK_SIZE))
  const body = buildSitemapIndex(sitemapChildPaths(chunkCount))
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
