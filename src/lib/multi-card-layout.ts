/**
 * multi-card-layout.ts
 * 複數卡「跨格位呈現」的幾何單一真相：一張官方合成圖要佔幾格、怎麼切、怎麼轉。
 *
 * 與 `card-number.ts` 的分工：後者管卡號字串**結構**（幾個成分、怎麼串接），
 * 本檔把「成分數 + 卡種」翻譯成**版面幾何**。零 Prisma 依賴（client 元件直接 import）。
 *
 * ## 為何需要
 * 複數卡（見 card-number.ts）的官方 detail 頁只有**一張合成圖**，由 N 張實體卡拼成。
 * 實體卡冊裡它們是 N 張卡插在 N 個口袋，所以卡冊內也讓它佔 N 格、每格顯示合成圖的對應區塊。
 *
 * ## 三種形態（合成圖尺寸為實測值）
 * | 形態 | 合成圖 | 原圖切法 | 旋轉 | 顯示佔格 | 每格區塊 aspect |
 * |---|---|---|---|---|---|
 * | LEGEND（上下**橫**卡） | 480×687 | 1 欄 × 2 列 | 逆時針 90° | 2 欄 × 1 列 | 343×480 → 0.716 |
 * | M6 スタジアム（左右直卡） | 868×606 | 2 欄 × 1 列 | 0° | 2 欄 × 1 列 | 434×606 → 0.716 |
 * | V-UNION | 1200×1670 | 2 欄 × 2 列 | 0° | 2 欄 × 2 列 | 600×835 → 0.719 |
 *
 * 標準卡 63/88 = 0.716 = 格位的 `aspect-5/7`，故**每個區塊精準吻合格位，零裁切零留白**。
 * LEGEND 的兩半是橫式卡，合成圖整體比例反而≈標準直卡；轉正 90° 後即與 M6 同為左右兩格。
 */

import { splitCardNumber } from './card-number'

/** 順時針角度。LEGEND 用 270（＝逆時針 90°，讓上半張落在左格、與卡號順序一致）。 */
export type SpanRotation = 0 | 90 | 180 | 270

export interface SpanLayout {
  /** 顯示佔格欄數（旋轉後） */
  cols: number
  /** 顯示佔格列數（旋轉後） */
  rows: number
  /** 原圖切法：欄數（旋轉前） */
  sourceCols: number
  /** 原圖切法：列數（旋轉前） */
  sourceRows: number
  rotation: SpanRotation
}

/** 群組成員上限 = 最大的 cols×rows（V-UNION 2×2）。 */
export const MAX_SPAN_SLOTS = 4

/**
 * 卡片的自然跨格佈局；非複數卡回 null。
 *
 * ⚠️ 成分數 2 需要再分辨兩種形態，判準是 `supertype`：
 * - `Trainer` → M6 スタジアム 型（左右兩張**直式**卡，不旋轉）
 * - 其他 → LEGEND 型（上下兩張**橫式**卡，逆時針轉正）
 *
 * `supertype === 'Trainer'` 跨語言成立（ZH_TW 的 supertype 值也是英文 `Trainer`）。
 * JA 舊世代有大量 supertype 為空字串的卡，會落到 LEGEND 分支——對現存的 LEGEND 正確。
 */
export function resolveSpanLayout(card: {
  cardNumber: string | null | undefined
  supertype: string | null | undefined
}): SpanLayout | null {
  const count = splitCardNumber(card.cardNumber).length

  if (count === 4) {
    return { cols: 2, rows: 2, sourceCols: 2, sourceRows: 2, rotation: 0 }
  }
  if (count === 2) {
    return card.supertype === 'Trainer'
      ? { cols: 2, rows: 1, sourceCols: 2, sourceRows: 1, rotation: 0 }
      : { cols: 2, rows: 1, sourceCols: 1, sourceRows: 2, rotation: 270 }
  }
  return null
}

/**
 * 由 DB 儲存的群組幾何（cols/rows/rotation）還原完整 layout。
 *
 * 原圖切法完全由「顯示佔格 + 旋轉」決定：旋轉 90/270 時長寬互換，故 DB 不需要多存兩欄，
 * 也讓未來的自訂跨格圖（無卡片可推導）走同一條路。
 */
export function spanLayoutFromStored(cols: number, rows: number, rotation: number): SpanLayout {
  const normalized = (((rotation % 360) + 360) % 360) as SpanRotation
  const swapped = normalized % 180 !== 0
  return {
    cols,
    rows,
    sourceCols: swapped ? rows : cols,
    sourceRows: swapped ? cols : rows,
    rotation: normalized,
  }
}

/**
 * 顯示格 index（row-major，0 = 左上）→ 原圖區塊座標。
 *
 * rotation 0 時是單純的 row-major 換算；rotation 270（逆時針 90°）時，顯示格的
 * (row, col) 對應原圖的 (row = col, col = sourceCols - 1 - row)——LEGEND 即
 * 左格(0,0) → 原圖上半(0,0)、右格(0,1) → 原圖下半(1,0)。
 */
export function sourceCellForIndex(
  layout: SpanLayout,
  groupIndex: number,
): { row: number; col: number } {
  const row = Math.floor(groupIndex / layout.cols)
  const col = groupIndex % layout.cols

  switch (layout.rotation) {
    case 270:
      return { row: col, col: layout.sourceCols - 1 - row }
    case 90:
      return { row: layout.sourceRows - 1 - col, col: row }
    case 180:
      return { row: layout.sourceRows - 1 - row, col: layout.sourceCols - 1 - col }
    default:
      return { row, col }
  }
}
