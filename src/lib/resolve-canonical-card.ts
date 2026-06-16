import { prisma } from '@/lib/prisma'

type CardLookupClient = { card: { findUnique: typeof prisma.card.findUnique } }

export type ResolveCanonicalCardResult =
  | { status: 'ok'; resolvedCardId: string }
  | { status: 'not_found' }
  | { status: 'canonical_missing' }

/**
 * Resolves an OPCG ZH_TW alias card (isCollectible=false) to its canonical
 * (JA) cardId; non-alias cards resolve to themselves. See docs/PATTERNS.md
 * "Canonical Card Resolution".
 */
export async function resolveCanonicalCardId(
  client: CardLookupClient,
  cardId: string,
): Promise<ResolveCanonicalCardResult> {
  const card = await client.card.findUnique({
    where: { id: cardId },
    select: { isCollectible: true, canonicalCardId: true },
  })
  if (!card) return { status: 'not_found' }

  if (!card.isCollectible && card.canonicalCardId) {
    const canonical = await client.card.findUnique({ where: { id: card.canonicalCardId } })
    if (!canonical) return { status: 'canonical_missing' }
    return { status: 'ok', resolvedCardId: card.canonicalCardId }
  }

  return { status: 'ok', resolvedCardId: cardId }
}
