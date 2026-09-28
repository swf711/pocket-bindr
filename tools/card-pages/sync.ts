import type { Game, Language } from '@prisma/client'
import { gameToPath, langToPath } from '@/lib/card-url'

/**
 * R2 物件 key：解碼後的 `{game}/{language}/{externalId}`，無副檔名。
 *
 * 🔴 刻意用「解碼後」的 externalId（不像 cardPublicPath 對 URL path 段做 encodeURIComponent）：
 * R2 物件 key 本身沒有 URL path 段的保留字元限制，S3 相容 API 接受任意 UTF-8 字串當 key；
 * 自訂網域請求進來時 Cloudflare 已把 URL path 解碼一次才拿去對 R2 key，若我們在上傳端又 encode
 * 一次，兩端就對不上（`ex10-!` 這類含特殊字元的 externalId 是實際會撞到的邊界案例）。
 */
export function objectKeyFor(card: { game: Game; language: Language; externalId: string }): string {
  return `${gameToPath(card.game)}/${langToPath(card.language)}/${card.externalId}`
}

export type SyncPlan = { upload: string[]; remove: string[] }

/** 比較本機（key → content md5）與 R2 現存（key → ETag）狀態，只上傳 md5 不同者，並列出孤兒 key。 */
export function planSync(local: Map<string, string>, remote: Map<string, string>): SyncPlan {
  const upload: string[] = []
  for (const [key, md5] of local) {
    const etag = remote.get(key)
    if (!etag || etag.replace(/"/g, '') !== md5) upload.push(key)
  }
  const remove: string[] = []
  for (const key of remote.keys()) {
    if (!local.has(key)) remove.push(key)
  }
  return { upload, remove }
}

/**
 * 破壞性資料操作安全規則（CLAUDE.md）：刪除前的最後防線。任何單次同步刪除量超過
 * `max(50, 1% of total)` 一律視為異常（例如查詢邏輯出錯把整批 key 誤判為孤兒）並中止，
 * 不靜默清空 R2 bucket。
 */
export function assertSafeRemoval(remove: readonly string[], total: number): void {
  const limit = Math.max(50, Math.ceil(total * 0.01))
  if (remove.length > limit) {
    throw new Error(
      `assertSafeRemoval: 將刪除 ${remove.length} 個物件，超過安全上限 ${limit}（total=${total}）。` +
        `請確認是否為預期行為（如整批系列下架），否則可能是查詢邏輯錯誤，已中止同步。`,
    )
  }
}
