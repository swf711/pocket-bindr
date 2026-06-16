import { prisma } from '@/lib/prisma'

export type CollectionEntry = { owned: number | null; wanted: number | null }

type CardForLookup = { id: string; isCollectible: boolean; canonicalCardId?: string | null }

/** OPCG ZH_TW alias 卡（isCollectible=false）的收藏狀態查 canonicalCardId，其餘卡查自己 id。 */
export function resolveCollectionLookupId(card: CardForLookup): string {
  return !card.isCollectible && card.canonicalCardId ? card.canonicalCardId : card.id
}

export async function getCollectionStatusMap(
  cards: CardForLookup[],
  userId: string | undefined,
  includeCanonical: boolean,
): Promise<Record<string, CollectionEntry>> {
  if (!userId) return {}

  const cardIds = cards.map(c => c.id)
  const canonicalIds = includeCanonical
    ? cards.flatMap(c => (c.canonicalCardId ? [c.canonicalCardId] : []))
    : []
  const allIds = [...new Set([...cardIds, ...canonicalIds])]
  if (allIds.length === 0) return {}

  const userCards = await prisma.userCard.findMany({
    where: { userId, cardId: { in: allIds } },
    select: { cardId: true, status: true, quantity: true },
  })

  const map: Record<string, CollectionEntry> = {}
  for (const uc of userCards) {
    if (!map[uc.cardId]) {
      map[uc.cardId] = { owned: null, wanted: null }
    }
    if (uc.status === 'owned') {
      map[uc.cardId].owned = uc.quantity
    } else if (uc.status === 'wanted') {
      map[uc.cardId].wanted = uc.quantity
    }
  }
  return map
}
