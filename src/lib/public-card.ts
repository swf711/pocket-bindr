import { unstable_cache } from 'next/cache'
import { Game, Language } from '@prisma/client'
import {
  CARD_NUMBER_ORDER_SQL,
  fetchCardByTriple,
  fetchCardByTripleInsensitive,
  fetchSameSetCards,
} from '@/lib/public-card-queries'

export { CARD_NUMBER_ORDER_SQL }
export type { PublicCardRow, SameSetCardRow } from '@/lib/public-card-queries'

/**
 * Shared by the card data caches and the card page's ISR `revalidate`. Next uses the
 * shortest revalidate in a page's tree, so a shorter value here would silently shorten
 * the page's CDN lifetime too. Card data only changes via maintenance backfills.
 */
export const CARD_PAGE_REVALIDATE_SECONDS = 86400

/**
 * (game, language, externalId) 精確比對；externalId 大小寫不確定時（OPCG 混大小寫含 `_`）
 * 兜底 case-insensitive 查詢，避免使用者手動輸入大小寫不符時 404。
 *
 * 純查詢邏輯在 public-card-queries.ts（供 tools/card-pages 產生器等不需要 unstable_cache
 * 的呼叫端直接重用）；此處只負責包一層 Next cache。
 */
export function getPublicCardByTriple(game: Game, language: Language, externalId: string) {
  return unstable_cache(
    async () => {
      const exact = await fetchCardByTriple(game, language, externalId)
      if (exact) return exact
      return fetchCardByTripleInsensitive(game, language, externalId)
    },
    ['card-public', game, language, externalId],
    { revalidate: CARD_PAGE_REVALIDATE_SECONDS },
  )()
}

export function getSameSetCards(setId: string, excludeCardId: string, limit = 18) {
  return unstable_cache(
    () => fetchSameSetCards(setId, excludeCardId, limit),
    ['card-public-same-set', setId, excludeCardId, String(limit)],
    { revalidate: CARD_PAGE_REVALIDATE_SECONDS },
  )()
}
