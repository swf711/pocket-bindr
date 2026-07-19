'use client'

import { GridType } from '@prisma/client'
import { SlotCard } from './slot-card'
import { EmptySlotCard } from './empty-slot-card'
import type { BinderSlotItem, SlotWithCard } from '@/types/binder'

const GRID_COLS: Record<GridType, number> = {
  grid_1x2: 1,
  grid_2x2: 2,
  grid_3x3: 3,
  grid_4x3: 4,
  grid_4x4: 4,
}

interface BinderGridSlotsProps {
  slots: BinderSlotItem[]
  gridType: GridType
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onView?: (cardId: string) => void
  onCopy?: (slotId: string) => void
  isDragging?: boolean
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  highlightedSlotId?: string | null
  counterScale?: number
  tappedSlotId?: string | null
  onTapSlot?: (key: string) => void
}

/** Pure slot grid rendering — no DndContext. Use inside a parent DndContext. */
export function BinderGridSlots({
  slots,
  gridType,
  onDelete,
  onToggleStatus,
  onView,
  onCopy,
  isDragging = false,
  onAddCard,
  highlightedSlotId,
  counterScale = 1,
  tappedSlotId,
  onTapSlot,
}: BinderGridSlotsProps) {
  const cols = GRID_COLS[gridType]
  return (
    <div
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      className="grid gap-1"
    >
      {slots.map((slot) => {
        const emptyKey = `empty-${slot.pageNumber}-${slot.slotIndex}`
        return (
          <div key={slot.id ?? emptyKey}>
            {slot.id === null ? (
              <EmptySlotCard
                pageNumber={slot.pageNumber}
                slotIndex={slot.slotIndex}
                isDragging={isDragging}
                onAddCard={onAddCard}
                counterScale={counterScale}
              />
            ) : (
              <SlotCard
                slot={slot as SlotWithCard}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
                onView={onView}
                onCopy={onCopy}
                isHighlighted={highlightedSlotId === slot.id}
                counterScale={counterScale}
                isTapped={tappedSlotId === slot.id}
                onTap={onTapSlot ? () => onTapSlot(slot.id!) : undefined}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
