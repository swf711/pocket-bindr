import { prisma } from '@/lib/prisma'

type CardLookupClient = { card: { findUnique: typeof prisma.card.findUnique } }

export type ResolveCanonicalCardResult =
  | { status: 'ok'; resolvedCardId: string }
  | { status: 'not_found' }
  | { status: 'canonical_missing' }

/**
 * Resolves an OPCG ZH_TW alias card (isCollectible=false) to its canonical
 * (JA) cardId; non-alias cards resolve to themselves.
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

/**
 * 寫入收藏／格位時保留原始顯示語言：當 alias 被 resolve 成 canonical
 * （originalCardId ≠ resolvedCardId）時回傳 originalCardId 當 displayCardId；
 * 純 canonical 直接加入則回 null（不記 displayCardId）。
 */
export function deriveDisplayCardId(
  originalCardId: string,
  resolvedCardId: string,
): string | null {
  return originalCardId !== resolvedCardId ? originalCardId : null
}
