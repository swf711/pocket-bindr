'use client'

import { Plus } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'

export function EmptySlotCard({
  pageNumber,
  slotIndex,
  isDragging = false,
  onAddCard,
  counterScale = 1,
  isTapped = false,
  onTap,
}: {
  pageNumber: number
  slotIndex: number
  isDragging?: boolean
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  counterScale?: number
  isTapped?: boolean
  onTap?: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `empty-${pageNumber}-${slotIndex}` })

  return (
    <div
      ref={setNodeRef}
      data-page={pageNumber}
      data-index={slotIndex}
      onClick={onTap ? (e) => { e.stopPropagation(); onTap() } : undefined}
      className={`group relative w-full aspect-5/7 rounded-md border-2 border-dashed transition-colors ${
        isOver ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
      }`}
    >
      {onAddCard && !isDragging && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isTapped ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div style={{ transform: `scale(${counterScale})`, transformOrigin: 'center' }}>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              data-testid={`empty-slot-add-${pageNumber}-${slotIndex}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onAddCard(pageNumber, slotIndex) }}
              title="加入卡片"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
