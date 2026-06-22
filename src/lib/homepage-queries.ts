import type { Game, Language } from '@prisma/client'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import type { LatestSet, ShowcaseCard, WantedRankCard } from '@/types/homepage'

export type { LatestSet, ShowcaseCard, WantedRankCard, GameTabData } from '@/types/homepage'

export async function getShowcaseCards(
  game: Game,
  language: Language,
  limit = 6
): Promise<ShowcaseCard[]> {
  const cards = await prisma.card.findMany({
    where: { game, language, isCollectible: true, imageSmall: { not: '' } },
    select: {
      id: true,
      name: true,
      imageSmall: true,
      imageLarge: true,
      supertype: true,
      rarity: true,
      hp: true,
      types: true,
      cardNumber: true,
      isCollectible: true,
      canonicalCardId: true,
      attributes: true,
      set: {
        select: { id: true, name: true, series: true, externalId: true, releaseDate: true },
      },
      aliases: {
        where: { language: 'ZH_TW' },
        select: { name: true, set: { select: { name: true } } },
      },
    },
    orderBy: [{ rarity: 'asc' }, { id: 'asc' }],
    take: limit,
  })

  return cards.map((card) => ({
    id: card.id,
    name: card.name,
    imageSmall: getCardImageUrl(card.imageSmall) ?? card.imageSmall,
    imageLarge: getCardImageUrl(card.imageLarge) ?? card.imageLarge,
    supertype: card.supertype,
    rarity: card.rarity,
    hp: card.hp,
    types: card.types,
    cardNumber: card.cardNumber,
    isCollectible: card.isCollectible,
    canonicalCardId: card.canonicalCardId,
    attributes: card.attributes as Record<string, unknown> | null,
    canonicalCard: null,
    collectionStatus: { owned: 0, wanted: 0 },
    set: {
      id: card.set.id,
      name: card.set.name,
      series: card.set.series,
      externalId: card.set.externalId,
      releaseDate: card.set.releaseDate?.toISOString().split('T')[0] ?? null,
    },
    zhName: card.aliases[0]?.name,
    zhSetName: card.aliases[0]?.set.name,
  }))
}

export async function getLatestSetsByGame(
  game: Game,
  language: Language,
  limit = 6
): Promise<LatestSet[]> {
  const sets = await prisma.cardSet.findMany({
    where: { game, language, releaseDate: { not: null } },
    orderBy: { releaseDate: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      game: true,
      language: true,
      symbolUrl: true,
      releaseDate: true,
      totalCards: true,
      externalId: true,
    },
  })
  return sets.map((s) => ({ ...s, releaseDate: s.releaseDate! }))
}

const _getMostWantedCards = async (
  game: Game,
  language: Language,
  limit: number
): Promise<WantedRankCard[]> => {
  const topWanted = await prisma.userCard.groupBy({
    by: ['cardId'],
    where: { status: 'wanted' },
    _count: { cardId: true },
    orderBy: { _count: { cardId: 'desc' } },
    take: limit * 10,
  })

  if (topWanted.length === 0) return []

  const cardIds = topWanted.map((r) => r.cardId)
  const cards = await prisma.card.findMany({
    where: {
      id: { in: cardIds },
      game,
      language,
      isCollectible: true,
      imageSmall: { not: '' },
    },
    select: {
      id: true,
      name: true,
      imageSmall: true,
      rarity: true,
      set: { select: { name: true } },
      aliases: {
        where: { language: 'ZH_TW' },
        select: { name: true, set: { select: { name: true } } },
      },
    },
  })

  const countMap = new Map(topWanted.map((r) => [r.cardId, r._count.cardId]))
  return cards
    .map((card) => ({
      cardId: card.id,
      name: card.name,
      imageSmall: getCardImageUrl(card.imageSmall) ?? card.imageSmall,
      rarity: card.rarity,
      setName: card.set.name,
      wantedCount: countMap.get(card.id) ?? 0,
      zhName: card.aliases[0]?.name,
      zhSetName: card.aliases[0]?.set.name,
    }))
    .sort((a, b) => b.wantedCount - a.wantedCount)
    .slice(0, limit)
}

export const getMostWantedCards = unstable_cache(
  _getMostWantedCards,
  ['homepage-most-wanted'],
  { revalidate: 600 }
)
