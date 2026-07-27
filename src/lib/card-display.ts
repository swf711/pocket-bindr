/**
 * 卡牌顯示用的純函式。
 *
 * PTCG JA 的 DP 世代有數百張卡官網本就沒有 `DPBP#` 收集號，`cardNumber` 為空字串是 authentic
 * 資料而非缺漏（資料層刻意保留空白）。呈現策略＝**值為空就整段省略**，與 card-jsonld.ts 對
 * rarity／supertype／hp 的條件輸出一致，避免出現「卡號：」的空欄位或「（DP-P ）」的多餘空格。
 *
 * 🔴 **本檔被 client component 匯入（`card-detail-drawer.tsx`／`report-dialog.tsx`），
 * 嚴禁 import `@prisma/client`**——`Prisma.sql` 一旦進 browser bundle 會在 module eval 階段
 * 直接拋 `sqltag is unable to run in this browser environment`，整頁掉進 error boundary。
 * 對應的排序 SQL 片段放在 server-only 的 `src/lib/public-card.ts`。
 */

/** cardNumber 是否有可顯示的值。空字串與 null 都算沒有（supertype 已有「空字串非 null」的前例）。 */
export function hasCardNumber(cardNumber: string | null | undefined): boolean {
  return Boolean(cardNumber && cardNumber.trim())
}

/**
 * 「系列碼 + 卡號」的單行標籤，供 metadata title / OG 圖 / 回報表單共用。
 * 無卡號時只回系列碼，不留尾空格。
 */
export function formatCardSetLabel(card: {
  set: { externalId: string }
  cardNumber: string | null | undefined
}): string {
  return hasCardNumber(card.cardNumber)
    ? `${card.set.externalId} ${card.cardNumber}`
    : card.set.externalId
}
