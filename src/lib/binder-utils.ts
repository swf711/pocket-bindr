import { GridType } from '@prisma/client'
import type { BinderSlotItem, EmptySlot, SlotWithCard } from '@/types/binder'
import { GRID_TYPE_SLOTS } from '@/types/binder'

export function buildGridPages(
  slots: SlotWithCard[],
  gridType: GridType,
): Map<number, BinderSlotItem[]> {
  const slotsPerPage = GRID_TYPE_SLOTS[gridType]
  const byPage = new Map<number, SlotWithCard[]>()
  for (const slot of slots) {
    if (!byPage.has(slot.pageNumber)) byPage.set(slot.pageNumber, [])
    byPage.get(slot.pageNumber)!.push(slot)
  }
  const maxPage = byPage.size > 0 ? Math.max(...byPage.keys()) : 1
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
