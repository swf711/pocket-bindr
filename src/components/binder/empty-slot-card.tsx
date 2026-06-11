'use client'

import { useDroppable } from '@dnd-kit/core'

export function EmptySlotCard({
  pageNumber,
  slotIndex,
}: {
  pageNumber: number
  slotIndex: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `empty-${pageNumber}-${slotIndex}` })

  return (
    <div
      ref={setNodeRef}
      data-page={pageNumber}
      data-index={slotIndex}
      className={`aspect-[5/7] w-full rounded-md border-2 border-dashed transition-colors ${
        isOver ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
      }`}
    />
  )
}
