import type { Game, Language, Prisma } from '@prisma/client'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import { HIGH_RARITIES, compareShowcaseCards } from '@/lib/homepage-rarity'
import type { LatestSet, ShowcaseCard } from '@/types/homepage'

export type { LatestSet, ShowcaseCard, GameTabData } from '@/types/homepage'

const _getTotalCardCount = async () =>
  prisma.card.count({ where: { isCollectible: true } })

export const getTotalCardCount = unstable_cache(
  _getTotalCardCount,
  ['homepage-total-card-count'],
  { revalidate: 3600 }
)

const showcaseCardSelect = {
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
    where: { language: 'ZH_TW' as const },
    select: { name: true, set: { select: { name: true } } },
  },
} satisfies Prisma.CardSelect

type ShowcaseCardRow = Prisma.CardGetPayload<{ select: typeof showcaseCardSelect }>

// PTCG 只展示寶可夢卡（排除 Trainer / Energy）；OPCG 不設限
function showcaseSupertypeFilter(game: Game): Prisma.CardWhereInput {
  return game === 'PTCG' ? { supertype: 'Pokémon' } : {}
}

function mapToShowcaseCard(card: ShowcaseCardRow): ShowcaseCard {
  return {
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
  }
}

export async function getShowcaseCards(
  game: Game,
  language: Language,
  limit = 6
): Promise<ShowcaseCard[]> {
  const poolSize = limit * 4

  let cards = await prisma.card.findMany({
    where: {
      game,
      language,
      isCollectible: true,
      imageSmall: { not: '' },
      ...showcaseSupertypeFilter(game),
      rarity: { in: HIGH_RARITIES[game] },
    },
    select: showcaseCardSelect,
    orderBy: { cardNumber: 'desc' },
    take: poolSize,
  })

  // 部分來源（如 PTCG ZH_TW）rarity 全空，rarity in 過濾會 0 命中，退回無過濾撈取，
  // 靠 compareShowcaseCards 以卡號兜底找出 secret 卡
  if (cards.length < limit) {
    cards = await prisma.card.findMany({
      where: {
        game,
        language,
        isCollectible: true,
        imageSmall: { not: '' },
        ...showcaseSupertypeFilter(game),
      },
      select: showcaseCardSelect,
      orderBy: { cardNumber: 'desc' },
      take: poolSize,
    })
  }

  return cards
    .map(mapToShowcaseCard)
    .sort(compareShowcaseCards(game))
    .slice(0, limit)
}

export async function getLatestSeriesCards(
  game: Game,
  language: Language,
  limit: number
): Promise<ShowcaseCard[]> {
  const latestSet = await prisma.cardSet.findFirst({
    where: { game, language, releaseDate: { not: null } },
    orderBy: { releaseDate: 'desc' },
    select: { id: true },
  })
  if (!latestSet) return []

  const cards = await prisma.card.findMany({
    where: {
      setId: latestSet.id,
      isCollectible: true,
      imageSmall: { not: '' },
      ...showcaseSupertypeFilter(game),
    },
    select: showcaseCardSelect,
    take: 300,
  })

  return cards
    .map(mapToShowcaseCard)
    .sort(compareShowcaseCards(game))
    .slice(0, limit)
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

