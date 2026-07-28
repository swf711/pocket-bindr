import type { GridType } from '@prisma/client'
import { GRID_TYPE_COLS } from '@/types/binder'

/** spread 自然座標寬度（與 binder-spread-view 的 SPREAD_NATURAL_WIDTH 一致） */
const SPREAD_NATURAL_WIDTH = 1200
/** 兩個 panel 之間的 gap-4 */
const PANEL_GAP = 16
/** panel 左右各 4px 邊框 */
const PANEL_BORDER = 4
/** panel 內容 p-4 */
const PANEL_PADDING = 16
/** 格線 gap-1 */
const SLOT_GAP = 4
/** icon-sm 按鈕邊長（size-8） */
const ACTION_BUTTON_SIZE = 32
/** 最多同時橫排的操作按鈕數：切換狀態／查看／跨格／複製／刪除 */
const MAX_INLINE_ACTIONS = 5
/** 左右各留一點餘裕，避免剛好貼齊格位邊緣 */
const FIT_MARGIN = 8

/**
 * 格位在自然座標系（未經 Snowglobe scale）的寬度。
 */
export function getNaturalSlotWidth(gridType: GridType): number {
  const cols = GRID_TYPE_COLS[gridType]
  const panelWidth = (SPREAD_NATURAL_WIDTH - PANEL_GAP) / 2
  const contentWidth = panelWidth - PANEL_BORDER * 2 - PANEL_PADDING * 2
  return (contentWidth - SLOT_GAP * (cols - 1)) / cols
}

/**
 * 桌面雙頁 view 是否該把格位操作按鈕收合成 ⋯ 選單。
 *
 * ⚠️ 不能只看視窗寬度：Snowglobe（useScaleFit）是**依可用高度**把整個 spread 縮放到剛好放得下，
 * 所以格位的實際視覺寬度 = 自然寬度 × scale，同時受寬與高影響（例：iPad 直向 820×1180 寬度雖 ≥768px，
 * 但 scale 被壓到約 0.68，格位只剩約 124px，5 顆按鈕共 160px 必定溢出）。
 * 操作按鈕經 counter-scale 後視覺尺寸固定，故直接拿「格位視覺寬度」與「按鈕列所需寬度」相比。
 */
export function shouldCompactSlotActions(gridType: GridType, scale: number): boolean {
  if (scale <= 0) return false
  const visualSlotWidth = getNaturalSlotWidth(gridType) * scale
  return visualSlotWidth < MAX_INLINE_ACTIONS * ACTION_BUTTON_SIZE + FIT_MARGIN
}
