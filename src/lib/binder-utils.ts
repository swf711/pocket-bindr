import { GridType } from '@prisma/client'
import type { BinderSlotItem, EmptySlot, SlotWithCard } from '@/types/binder'
import { GRID_TYPE_SLOTS } from '@/types/binder'

export function buildGridPages(
  slots: SlotWithCard[],
  gridType: GridType,
  totalPages?: number,
): Map<number, BinderSlotItem[]> {
  const slotsPerPage = GRID_TYPE_SLOTS[gridType]
  const byPage = new Map<number, SlotWithCard[]>()
  for (const slot of slots) {
    if (!byPage.has(slot.pageNumber)) byPage.set(slot.pageNumber, [])
    byPage.get(slot.pageNumber)!.push(slot)
  }
  const maxPageFromSlots = byPage.size > 0 ? Math.max(...byPage.keys()) : 0
  const maxPage = Math.max(totalPages ?? 0, maxPageFromSlots, 1)
  const pages = new Map<number, BinderSlotItem[]>()
  for (let page = 1; page <= maxPage; page++) {
    const pageSlots = byPage.get(page) ?? []
    const grid: BinderSlotItem[] = Array.from({ length: slotsPerPage }, (_, i) => {
      const filled = pageSlots.find((s) => s.slotIndex === i)
      return filled ?? ({ id: null, pageNumber: page, slotIndex: i } satisfies EmptySlot)
    })
    pages.set(page, grid)
  }
  return pages
}

export function computeSlotMigration(
  overflowSlots: { id: string; pageNumber: number; slotIndex: number }[],
  newSlotsPerPage: number,
  currentTotalPages: number,
): { id: string; newPageNumber: number; newSlotIndex: number }[] {
  const sorted = [...overflowSlots].sort(
    (a, b) => a.pageNumber - b.pageNumber || a.slotIndex - b.slotIndex,
  )
  return sorted.map((slot, i) => ({
    id: slot.id,
    newPageNumber: currentTotalPages + Math.floor(i / newSlotsPerPage) + 1,
    newSlotIndex: i % newSlotsPerPage,
  }))
}

export type GridPage = BinderSlotItem[]

export type SpreadPageContent =
  | { type: 'cover' }
  | { type: 'page'; pageNumber: number; page: GridPage }
  | { type: 'blank' }

export interface Spread {
  index: number
  left: SpreadPageContent
  right: SpreadPageContent
}

/**
 * Spread 0: left = cover, right = Page 1 (pages[0])
 * Spread N (N>=1): left = Page 2N-1 (pages[2N-2]), right = Page 2N (pages[2N-1])
 * If right page doesn't exist (odd-length pages), right = { type: 'blank' }
 */
export function buildSpreads(pages: GridPage[]): Spread[] {
  const spreads: Spread[] = []

  const right0: SpreadPageContent =
    pages.length > 0
      ? { type: 'page', pageNumber: 1, page: pages[0] }
      : { type: 'blank' }
  spreads.push({ index: 0, left: { type: 'cover' }, right: right0 })

  // pages[1] onward, grouped in pairs
  let i = 1
  while (i < pages.length) {
    const spreadIndex = spreads.length
    const leftPageNum = i + 1       // page numbers are 1-based
    const rightPageNum = i + 2
    const left: SpreadPageContent = { type: 'page', pageNumber: leftPageNum, page: pages[i] }
    const right: SpreadPageContent =
      i + 1 < pages.length
        ? { type: 'page', pageNumber: rightPageNum, page: pages[i + 1] }
        : { type: 'blank' }
    spreads.push({ index: spreadIndex, left, right })
    i += 2
  }

  return spreads
}

/**
 * Mobile page sequence: [cover, Page1, Page2, Page3, ...]
 */
export function buildMobilePages(pages: GridPage[]): SpreadPageContent[] {
  const result: SpreadPageContent[] = [{ type: 'cover' }]
  for (let i = 0; i < pages.length; i++) {
    result.push({ type: 'page', pageNumber: i + 1, page: pages[i] })
  }
  return result
}
