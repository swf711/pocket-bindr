import { unstable_cache } from 'next/cache'
import { Game, Language, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * 卡號排序片段：**有卡號的排前面**。
 *
 * Postgres 的 `''` 小於所有非空字串，直接 `ORDER BY "cardNumber" ASC` 會讓無卡號卡排到最前面。
 * 全站 83 個系列混有無卡號卡（`ja-DP5` 有 55 張），實測 `/cards` 列表第一頁 12 張、
 * 卡片頁「同系列其他卡」6 張會**全部**被無卡號卡佔滿。`NULLIF` 把空字串轉成 NULL，
 * 再以 `NULLS LAST` 推到最後。
 *
 * ⚠️ Prisma 的 `orderBy` 無法表達此運算式（`nulls: 'last'` 只適用真正 nullable 的欄位，
 * `cardNumber` 是 non-nullable 且值為空字串），故消費端一律走 `$queryRaw` 取 id 再撈完整列。
 *
 * 🔴 **刻意放在本檔（server-only）而非 `card-display.ts`**：後者被 client component 匯入，
 * `Prisma.sql` 進 browser bundle 會拋 `sqltag is unable to run in this browser environment`。
 */
export const CARD_NUMBER_ORDER_SQL = Prisma.sql`NULLIF("cardNumber", '') ASC NULLS LAST`

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
 * 精確比對未命中時的 case-insensitive 兜底。
 *
 * 走 migration 20260727064500 的表達式索引 `(game, language, lower("externalId"))`——
 * Prisma 的 `mode: 'insensitive'` 產生 ILIKE，用不到該索引，只能靠 (game, language) 前綴
 * 再逐列 filter，PTCG JA 這種大語系一次 miss 要讀約 12,900 個 buffer（≈100 MB）。
 * sitemap 上線後卡片頁被大量爬取，這條路徑（多為 404 或大小寫不符的 URL）被放大成 PROD 第 2 大成本。
 *
 * 🔴 enum 的 cast 必須下在「參數」上（`${game}::"Game"`）而非欄位上——
 * 寫成 `"game"::text = $1` 會讓索引整個失效退回 Seq Scan（見 src/app/api/cards/route.ts 同註）。
 */
async function fetchCardByTripleInsensitive(game: Game, language: Language, externalId: string) {
  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id" FROM "Card"
    WHERE "game" = ${game}::"Game"
      AND "language" = ${language}::"Language"
      AND lower("externalId") = lower(${externalId})
    LIMIT 1
  `)
  if (!rows[0]) return null
  return prisma.card.findUnique({ where: { id: rows[0].id }, include: cardPublicInclude })
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
      return fetchCardByTripleInsensitive(game, language, externalId)
    },
    ['card-public', game, language, externalId],
    { revalidate: 300 },
  )()
}

export type SameSetCardRow = Awaited<ReturnType<typeof getSameSetCards>>[number]

const sameSetCardSelect = {
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
} as const

/**
 * 同系列其他卡（內部連結區塊）：建立 74k 頁的內部連結圖，供爬蟲逐頁走。
 *
 * 排序需要「有卡號優先」（`CARD_NUMBER_ORDER_SQL`），Prisma 的 `orderBy` 表達不了，
 * 故先以 `$queryRaw` 取該頁 id、再 `findMany` 撈完整列並依 id 順序還原——
 * 與 `/api/cards` 的兩段式一致。只取 `limit` 張，若不做此排序，`ja-DP5` 這類系列
 * 會 6 張全是無卡號卡。
 */
async function fetchSameSetCards(setId: string, excludeCardId: string, limit: number) {
  const idRows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id" FROM "Card"
    WHERE "setId" = ${setId} AND "id" <> ${excludeCardId}
    ORDER BY ${CARD_NUMBER_ORDER_SQL}
    LIMIT ${limit}
  `)
  const pageIds = idRows.map(r => r.id)
  if (pageIds.length === 0) return []
  const fetched = await prisma.card.findMany({
    where: { id: { in: pageIds } },
    select: sameSetCardSelect,
  })
  const byId = new Map(fetched.map(c => [c.id, c]))
  return pageIds.map(id => byId.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c))
}

export function getSameSetCards(setId: string, excludeCardId: string, limit = 18) {
  return unstable_cache(
    () => fetchSameSetCards(setId, excludeCardId, limit),
    ['card-public-same-set', setId, excludeCardId, String(limit)],
    { revalidate: 300 },
  )()
}
