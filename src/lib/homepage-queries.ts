import type { Game, Language, Prisma } from '@prisma/client'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import { HIGH_RARITIES, compareShowcaseCards } from '@/lib/homepage-rarity'
import type { ShowcaseCard } from '@/types/homepage'

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
  externalId: true,
  game: true,
  language: true,
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
    externalId: card.externalId,
    game: card.game,
    language: card.language,
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

async function _getShowcaseCards(
  game: Game,
  language: Language,
  limit: number
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

/**
 * 首頁展示卡：資料只在爬蟲跑完才變，故與 getTotalCardCount 同樣快取 1 小時。
 * 帶參數的查詢不能用 module 級包裝，改用 public-card.ts 的 inline `unstable_cache(fn, keys)()` 寫法，
 * cache key 必須含全部參數。未快取前每次首頁 render 都直接打 DB（74k 卡表的大範圍 index scan）。
 */
export function getShowcaseCards(
  game: Game,
  language: Language,
  limit = 6
): Promise<ShowcaseCard[]> {
  return unstable_cache(
    () => _getShowcaseCards(game, language, limit),
    ['homepage-showcase', game, language, String(limit)],
    { revalidate: 3600 }
  )()
}

async function _getLatestSeriesCards(
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

/** 最新系列展示卡：同 getShowcaseCards，資料只隨爬蟲變動。 */
export function getLatestSeriesCards(
  game: Game,
  language: Language,
  limit: number
): Promise<ShowcaseCard[]> {
  return unstable_cache(
    () => _getLatestSeriesCards(game, language, limit),
    ['homepage-latest-series', game, language, String(limit)],
    { revalidate: 3600 }
  )()
}

