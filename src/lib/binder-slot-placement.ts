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
