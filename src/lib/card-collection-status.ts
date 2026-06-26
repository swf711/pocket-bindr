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

/**
 * /collection 專用：以「顯示身份」（displayCardId ?? cardId）為 key 聚合收藏狀態。
 * displayIds 為當頁顯示卡的 id 集合；OPCG ZH_TW alias 收藏的 UserCard.cardId 為
 * canonical JA，但 displayCardId 指向 ZH_TW alias，故以 displayCardId ?? cardId 還原顯示身份。
 */
export async function getDisplayCollectionStatusMap(
  displayIds: string[],
  userId: string,
): Promise<Record<string, CollectionEntry>> {
  if (displayIds.length === 0) return {}

  const userCards = await prisma.userCard.findMany({
    where: {
      userId,
      OR: [
        { displayCardId: { in: displayIds } },
        { displayCardId: null, cardId: { in: displayIds } },
      ],
    },
    select: { cardId: true, displayCardId: true, status: true, quantity: true },
  })

  const map: Record<string, CollectionEntry> = {}
  for (const uc of userCards) {
    const key = uc.displayCardId ?? uc.cardId
    if (!map[key]) {
      map[key] = { owned: null, wanted: null }
    }
    if (uc.status === 'owned') {
      map[key].owned = uc.quantity
    } else if (uc.status === 'wanted') {
      map[key].wanted = uc.quantity
    }
  }
  return map
}
