import { cardPath } from '@/lib/card-url'
import type { CardWithCollectionStatus } from '@/types/card'

/**
 * `/cards?...&open=<externalId>` 入口的落點判定：搜尋結果真正載入（非 placeholder）且含該卡
 * 才回傳導航目標，否則回 null（呼叫端顯示 toast、留在列表，不 push）。
 *
 * 🔴 `isPlaceholder` 為 true 時代表 react-query 正在用上一批（可能是 filter 切換前的舊資料）
 * 頂著顯示，此時 cards 內容不可信，貿然比對會誤判「找不到」或誤中舊資料裡同名的卡。
 */
export function resolveOpenTarget(
  cards: readonly CardWithCollectionStatus[],
  open: string | undefined | null,
  isPlaceholder: boolean,
): string | null {
  if (!open || isPlaceholder) return null
  const match = cards.find(card => card.externalId.toLowerCase() === open.toLowerCase())
  return match ? cardPath(match) : null
}
