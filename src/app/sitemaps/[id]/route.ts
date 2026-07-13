import {
  STATIC_ROUTES,
  buildUrlSet,
  cardChunkToPaths,
  getCardChunk,
  getCardCount,
  parseSitemapChildId,
  SITEMAP_CHUNK_SIZE,
} from '@/lib/sitemap'

export const revalidate = 86400

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const target = parseSitemapChildId(id)
  if (!target) return new Response(null, { status: 404 })

  if (target.kind === 'static') {
    return new Response(buildUrlSet(STATIC_ROUTES), { headers: { 'Content-Type': 'application/xml' } })
  }

  const cardCount = await getCardCount()
  const chunkCount = Math.max(1, Math.ceil(cardCount / SITEMAP_CHUNK_SIZE))
  if (target.index < 0 || target.index >= chunkCount) return new Response(null, { status: 404 })

  const rows = await getCardChunk(target.index)
  return new Response(buildUrlSet(cardChunkToPaths(rows)), {
    headers: { 'Content-Type': 'application/xml' },
  })
}
