import { prisma } from '@/lib/prisma'

type CardLookupClient = {
  card: { findUnique: typeof prisma.card.findUnique; findMany: typeof prisma.card.findMany }
}

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

/**
 * 批次版 resolveCanonicalCardId：兩次 findMany（主查 + canonical 存在性補查）
 * 取代逐張查詢，語意與單數版逐項一致。
 */
export async function resolveCanonicalCardIds(
  client: CardLookupClient,
  cardIds: string[],
): Promise<Map<string, ResolveCanonicalCardResult>> {
  const uniqueIds = Array.from(new Set(cardIds))
  const cards = await client.card.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, isCollectible: true, canonicalCardId: true },
  })
  const cardById = new Map(cards.map((c) => [c.id, c]))

  const canonicalIdsToCheck = Array.from(
    new Set(
      cards
        .filter((c) => !c.isCollectible && c.canonicalCardId)
        .map((c) => c.canonicalCardId as string),
    ),
  )
  const canonicalCards =
    canonicalIdsToCheck.length > 0
      ? await client.card.findMany({ where: { id: { in: canonicalIdsToCheck } }, select: { id: true } })
      : []
  const existingCanonicalIds = new Set(canonicalCards.map((c) => c.id))

  const result = new Map<string, ResolveCanonicalCardResult>()
  for (const id of uniqueIds) {
    const card = cardById.get(id)
    if (!card) {
      result.set(id, { status: 'not_found' })
      continue
    }
    if (!card.isCollectible && card.canonicalCardId) {
      if (!existingCanonicalIds.has(card.canonicalCardId)) {
        result.set(id, { status: 'canonical_missing' })
        continue
      }
      result.set(id, { status: 'ok', resolvedCardId: card.canonicalCardId })
      continue
    }
    result.set(id, { status: 'ok', resolvedCardId: id })
  }
  return result
}
