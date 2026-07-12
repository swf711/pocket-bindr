import { unstable_cache } from 'next/cache'
import { Game, Language } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * 卡片獨立 URL 頁（real page / intercept modal / same-set 區塊）共用的資料層——
 * 單一真相，避免與 GET /api/cards/[id] 兩套查詢邏輯漂移。
 * collectionStatus 為 user-specific，不進此快取，由呼叫端另補（見 card-standalone-view 的 client island）。
 */
const cardPublicInclude = {
  set: true,
  canonicalCard: {
    select: { id: true, imageSmall: true, imageLarge: true, language: true },
  },
} as const

export type PublicCardRow = NonNullable<Awaited<ReturnType<typeof fetchCardByTriple>>>

function fetchCardByTriple(game: Game, language: Language, externalId: string) {
  return prisma.card.findUnique({
    where: { game_language_externalId: { game, language, externalId } },
    include: cardPublicInclude,
  })
}

/**
 * (game, language, externalId) 精確比對；externalId 大小寫不確定時（OPCG 混大小寫含 `_`）
 * 兜底 case-insensitive 查詢，避免使用者手動輸入大小寫不符時 404。
 */
export function getPublicCardByTriple(game: Game, language: Language, externalId: string) {
  return unstable_cache(
    async () => {
      const exact = await fetchCardByTriple(game, language, externalId)
      if (exact) return exact
      return prisma.card.findFirst({
        where: { game, language, externalId: { equals: externalId, mode: 'insensitive' } },
        include: cardPublicInclude,
      })
    },
    ['card-public', game, language, externalId],
    { revalidate: 300 },
  )()
}

export type SameSetCardRow = Awaited<ReturnType<typeof getSameSetCards>>[number]

/** 同系列其他卡（內部連結區塊）：建立 74k 頁的內部連結圖，供爬蟲逐頁走。 */
export function getSameSetCards(setId: string, excludeCardId: string, limit = 18) {
  return unstable_cache(
    () =>
      prisma.card.findMany({
        where: { setId, id: { not: excludeCardId } },
        select: {
          id: true,
          name: true,
          externalId: true,
          language: true,
          game: true,
          cardNumber: true,
          isCollectible: true,
          imageSmall: true,
          imageLarge: true,
          canonicalCard: {
            select: { imageSmall: true, imageLarge: true },
          },
        },
        take: limit,
        orderBy: { cardNumber: 'asc' },
      }),
    ['card-public-same-set', setId, excludeCardId, String(limit)],
    { revalidate: 300 },
  )()
}
