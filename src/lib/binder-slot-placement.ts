import { MAX_PAGES_PER_BINDER } from '@/lib/binder-limits'

export type SlotPosition = { pageNumber: number; slotIndex: number }

export type PlanSlotPlacementInput = {
  /** 依 (pageNumber asc, slotIndex asc) 排序、cardId 為 null 的空格 id 清單（已 take(needed)） */
  emptySlotIds: string[]
  /** binder 內目前最後一個格位（依 pageNumber desc, slotIndex desc），無格位則傳 null */
  lastSlot: SlotPosition | null
  slotsPerPage: number
  needed: number
}

export type PlanSlotPlacementResult = {
  /** 要直接填入卡牌的既有空格 id（依序對應待填清單前段） */
  fillSlotIds: string[]
  /** 需要新建的格位座標（依序對應待填清單後段） */
  newPositions: SlotPosition[]
  /** 若為 true，整批操作因超過 MAX_PAGES_PER_BINDER 而必須整批拒絕 */
  exceedsLimit: boolean
  /** 在不超過頁數上限的前提下，此卡冊當前還能再容納多少張卡（含既有空格） */
  remainingCapacity: number
}

/**
 * 純函式：計算「優先填空格、不足才新建格位」的配置結果，並判定是否超過
 * MAX_PAGES_PER_BINDER。單張與批次 route 共用，確保上限判定邏輯一致。
 */
export function planSlotPlacement({
  emptySlotIds,
  lastSlot,
  slotsPerPage,
  needed,
}: PlanSlotPlacementInput): PlanSlotPlacementResult {
  const maxAbsoluteIndex = MAX_PAGES_PER_BINDER * slotsPerPage - 1

  const lastAbsoluteIndex = lastSlot
    ? (lastSlot.pageNumber - 1) * slotsPerPage + lastSlot.slotIndex
    : -1

  const remainingNewSlotCapacity = Math.max(0, maxAbsoluteIndex - lastAbsoluteIndex)
  const remainingCapacity = emptySlotIds.length + remainingNewSlotCapacity

  const fillSlotIds = emptySlotIds.slice(0, needed)
  const slotsToCreate = needed - fillSlotIds.length

  const exceedsLimit = slotsToCreate > remainingNewSlotCapacity

  const newPositions: SlotPosition[] = []
  if (!exceedsLimit) {
    let nextAbsoluteIndex = lastAbsoluteIndex + 1
    for (let i = 0; i < slotsToCreate; i++) {
      newPositions.push({
        pageNumber: Math.floor(nextAbsoluteIndex / slotsPerPage) + 1,
        slotIndex: nextAbsoluteIndex % slotsPerPage,
      })
      nextAbsoluteIndex++
    }
  }

  return { fillSlotIds, newPositions, exceedsLimit, remainingCapacity }
}

// ── 跨格群組（BinderSlotGroup）的矩形放置 ────────────────────────────────────

/** occupied set 的 key 慣例。呼叫端與本檔共用，避免各自組字串而漂移。 */
export function slotKey(pageNumber: number, slotIndex: number): string {
  return `${pageNumber}:${slotIndex}`
}

/** 群組左上角所在的 slotIndex → 群組全部成員的 slotIndex（row-major，對應 groupIndex）。 */
export function groupSlotIndices(
  topLeftIndex: number,
  cols: number,
  rows: number,
  gridCols: number,
): number[] {
  const baseRow = Math.floor(topLeftIndex / gridCols)
  const baseCol = topLeftIndex % gridCols
  const indices: number[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      indices.push((baseRow + r) * gridCols + (baseCol + c))
    }
  }
  return indices
}

export type GroupPlacement = {
  pageNumber: number
  /** 依 groupIndex 排序的成員格位 index（[0] = 左上 = anchor） */
  slotIndices: number[]
  /** 是否放在既有頁數之外的新頁 */
  newPage: boolean
}

export type PlanGroupPlacementResult =
  | ({ status: 'placed' } & GroupPlacement)
  /** 此格線容不下該形狀（如 grid_1x2 只有 1 欄），呼叫端應退回單格 */
  | { status: 'unsupported' }
  /** 需要新頁但已達 MAX_PAGES_PER_BINDER，整組拒絕 */
  | { status: 'pageLimit' }

/**
 * 為跨格群組找一塊連續矩形空區：**同頁優先、頁碼由小到大**，找不到就往後開新頁放左上角。
 *
 * 與 `planSlotPlacement`（線性填空格）刻意分開：矩形搜尋不能用線性 index 表達，
 * 且「放不下就開新頁」會在前頁留下零星空格——這是決策上接受的代價。
 */
export function planGroupPlacement(input: {
  /** 已佔用格位，key 為 `slotKey()` */
  occupied: ReadonlySet<string>
  gridCols: number
  slotsPerPage: number
  /** 目前頁數（新頁從 totalPages + 1 起算） */
  totalPages: number
  cols: number
  rows: number
  /** 優先嘗試的頁碼（比照 findNextEmptySlot 的「同頁優先」慣例），其餘頁再依序遞補 */
  preferPage?: number
}): PlanGroupPlacementResult {
  const { occupied, gridCols, slotsPerPage, totalPages, cols, rows, preferPage } = input
  const gridRows = Math.floor(slotsPerPage / gridCols)

  if (cols > gridCols || rows > gridRows) return { status: 'unsupported' }

  const pageOrder =
    preferPage && preferPage >= 1 && preferPage <= totalPages
      ? [preferPage, ...Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p !== preferPage)]
      : Array.from({ length: totalPages }, (_, i) => i + 1)

  for (const page of pageOrder) {
    for (let r = 0; r + rows <= gridRows; r++) {
      for (let c = 0; c + cols <= gridCols; c++) {
        const indices = groupSlotIndices(r * gridCols + c, cols, rows, gridCols)
        if (indices.every((i) => !occupied.has(slotKey(page, i)))) {
          return { status: 'placed', pageNumber: page, slotIndices: indices, newPage: false }
        }
      }
    }
  }

  const newPageNumber = totalPages + 1
  if (newPageNumber > MAX_PAGES_PER_BINDER) return { status: 'pageLimit' }

  return {
    status: 'placed',
    pageNumber: newPageNumber,
    slotIndices: groupSlotIndices(0, cols, rows, gridCols),
    newPage: true,
  }
}
