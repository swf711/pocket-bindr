'use client'

import { GridType } from '@prisma/client'
import { SlotCard } from './slot-card'
import { EmptySlotCard } from './empty-slot-card'
import { GRID_TYPE_COLS } from '@/types/binder'
import type { BinderSlotItem, SlotWithCard } from '@/types/binder'

interface BinderGridSlotsProps {
  slots: BinderSlotItem[]
  gridType: GridType
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onView?: (cardId: string) => void
  onCopy?: (slotId: string) => void
  onToggleSpan?: (slotId: string, mode: 'span' | 'single') => void
  isDragging?: boolean
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  highlightedSlotId?: string | null
  expandingGroupId?: string | null
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
  onToggleSpan,
  isDragging = false,
  onAddCard,
  highlightedSlotId,
  expandingGroupId,
  counterScale = 1,
  tappedSlotId,
  onTapSlot,
}: BinderGridSlotsProps) {
  const cols = GRID_TYPE_COLS[gridType]
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
                onToggleSpan={onToggleSpan}
                isHighlighted={highlightedSlotId === slot.id}
                isExpanding={
                  expandingGroupId != null &&
                  (slot as SlotWithCard).span?.groupId === expandingGroupId
                }
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
