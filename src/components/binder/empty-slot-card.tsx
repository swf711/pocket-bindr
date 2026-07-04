'use client'

import { Plus } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'

export function EmptySlotCard({
  pageNumber,
  slotIndex,
  isDragging = false,
  onAddCard,
  counterScale: _counterScale = 1,
}: {
  pageNumber: number
  slotIndex: number
  isDragging?: boolean
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  /** 保留供 API 兼容；目前整格點擊不需縮放 */
  counterScale?: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `empty-${pageNumber}-${slotIndex}` })

  return (
    <div
      ref={setNodeRef}
      data-testid={`empty-slot-add-${pageNumber}-${slotIndex}`}
      data-page={pageNumber}
      data-index={slotIndex}
      onClick={(!isDragging && onAddCard) ? (e) => { e.stopPropagation(); onAddCard(pageNumber, slotIndex) } : undefined}
      className={`group relative w-full aspect-5/7 rounded-md border-2 border-dashed transition-colors ${
        isOver ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
      } ${(!isDragging && onAddCard) ? 'cursor-pointer' : ''}`}
    >
      {onAddCard && !isDragging && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-70 transition-opacity pointer-events-none">
          <Plus className="size-6 text-foreground" />
        </div>
      )}
    </div>
  )
}
