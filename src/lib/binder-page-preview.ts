import type { GridType } from '@prisma/client'
import { GRID_TYPE_COLS, GRID_TYPE_SLOTS } from '@/types/binder'

/**
 * 內頁縮圖的固定視覺高度（px）。
 *
 * 刻意**固定高度、由格式反推寬度**，而不是固定寬度反推高度：五種格式的長寬比差異很大
 * （grid_1x2 是 1 欄 2 列、grid_4x4 是 4 欄 4 列），固定寬度會讓前者算出的高度是後者的
 * 數倍，管理清單裡每張頁面卡片的高度就會忽高忽低。固定高度則所有格式的卡片等高，
 * 寬度全部落在 ~115px 以內。
 */
export const PAGE_PREVIEW_HEIGHT = 140
/** 格子之間的間距（px），小到只用來讓相鄰卡圖不黏在一起。 */
export const PAGE_PREVIEW_GAP = 2
/** 卡片比例 5:7，與格位的 `aspect-5/7` 一致。 */
const CARD_ASPECT = 5 / 7

export interface PagePreviewSize {
  cols: number
  rows: number
  cellWidth: number
  cellHeight: number
  width: number
}

/**
 * 依 gridType 算出內頁縮圖的格線尺寸。純計算，零 Prisma 依賴（client 元件直接匯入）。
 */
export function getPagePreviewSize(
  gridType: GridType,
  height: number = PAGE_PREVIEW_HEIGHT,
  gap: number = PAGE_PREVIEW_GAP,
): PagePreviewSize {
  const cols = GRID_TYPE_COLS[gridType]
  const rows = GRID_TYPE_SLOTS[gridType] / cols
  const cellHeight = (height - gap * (rows - 1)) / rows
  const cellWidth = cellHeight * CARD_ASPECT
  const width = cols * cellWidth + gap * (cols - 1)
  return { cols, rows, cellWidth, cellHeight, width }
}
