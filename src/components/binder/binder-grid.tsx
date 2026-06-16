'use client'

import { useState } from 'react'
import { GridType } from '@prisma/client'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
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
  isDragging?: boolean
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  highlightedSlotId?: string | null
}

/** Pure slot grid rendering — no DndContext. Use inside a parent DndContext. */
export function BinderGridSlots({
  slots,
  gridType,
  onDelete,
  onToggleStatus,
  onView,
  isDragging = false,
  onAddCard,
  highlightedSlotId,
}: BinderGridSlotsProps) {
  const cols = GRID_COLS[gridType]
  return (
    <div
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      className="grid gap-2"
    >
      {slots.map((slot) =>
        slot.id === null ? (
          <EmptySlotCard
            key={`empty-${slot.pageNumber}-${slot.slotIndex}`}
            pageNumber={slot.pageNumber}
            slotIndex={slot.slotIndex}
            isDragging={isDragging}
            onAddCard={onAddCard}
          />
        ) : (
          <SlotCard
            key={slot.id}
            slot={slot as SlotWithCard}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            onView={onView}
            isHighlighted={highlightedSlotId === slot.id}
          />
        ),
      )}
    </div>
  )
}

interface BinderGridProps {
  slots: BinderSlotItem[]
  gridType: GridType
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onSwap: (slotAId: string, slotBId: string) => void
  onMove: (slotId: string, pageNumber: number, slotIndex: number) => void
  onView?: (cardId: string) => void
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  highlightedSlotId?: string | null
}

export function BinderGrid({ slots, gridType, onDelete, onToggleStatus, onSwap, onMove, onView, onAddCard, highlightedSlotId }: BinderGridProps) {
  const [activeSlot, setActiveSlot] = useState<SlotWithCard | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    const slotId = (event.active.id as string).replace('slot-', '')
    const slot = slots.find((s): s is SlotWithCard => s.id === slotId)
    setActiveSlot(slot ?? null)
    setIsDragging(true)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveSlot(null)
    setIsDragging(false)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (overId.startsWith('empty-')) {
      const parts = overId.split('-')
      const pageNumber = parseInt(parts[1])
      const slotIndex = parseInt(parts[2])
      const slotId = activeId.replace('slot-', '')
      onMove(slotId, pageNumber, slotIndex)
    } else if (overId.startsWith('drop-')) {
      const slotAId = activeId.replace('slot-', '')
      const slotBId = overId.replace('drop-', '')
      if (slotAId !== slotBId) onSwap(slotAId, slotBId)
    }
  }

  return (
    <DndContext id="binder-dnd" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <BinderGridSlots
        slots={slots}
        gridType={gridType}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        onView={onView}
        isDragging={isDragging}
        onAddCard={onAddCard}
        highlightedSlotId={highlightedSlotId}
      />
      <DragOverlay>
        {activeSlot ? (
          <SlotCard slot={activeSlot} onDelete={() => {}} onToggleStatus={() => {}} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
