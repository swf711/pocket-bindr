import type { Game, Language } from '@prisma/client'
import { cardPath } from '@/lib/card-url'

/**
 * 卡片分享用絕對 URL。
 *
 * ⚠️ 分享連結一律由此組出，禁用 `window.location.href`——CardDetailDrawer 在 /cards、
 * /binders/[id]、/collection、/b/[token] 四處重用，只有 /cards（intercepting route）的
 * 網址列剛好是卡片 URL，其餘會分享出卡冊 URL。
 */
export function buildCardShareUrl(
  card: { game: Game; language: Language; externalId: string },
  origin: string,
): string {
  return `${origin}${cardPath(card)}`
}

export type ShareOutcome = 'shared' | 'copied' | 'dismissed'

/**
 * 優先走 Web Share API（系統分享單），不支援時 fallback 到剪貼簿。
 *
 * 判斷條件是「navigator.share 是否存在」，不以裝置類型判斷：非 HTTPS 環境不可用，
 * 桌面 Chrome 亦可能支援。使用者取消系統分享單會 throw AbortError，那是正常操作、
 * 不是失敗，故回 'dismissed' 讓呼叫端跳過錯誤提示。
 */
export async function shareOrCopy(url: string, title: string): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'dismissed'
      // 其他錯誤（如 NotAllowedError）代表分享單開不起來，退回剪貼簿。
    }
  }

  await navigator.clipboard.writeText(url)
  return 'copied'
}
