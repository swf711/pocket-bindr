'use client'

import { useRef, useState } from 'react'
import { GridType } from '@prisma/client'
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { BinderGridSlots } from './binder-grid'
import { BinderCoverPanel } from './binder-cover-panel'
import { SlotCard } from './slot-card'
import { useEdgeHoverPageFlip } from '@/hooks/use-edge-hover-page-flip'
import type { Spread, SpreadPageContent } from '@/lib/binder-utils'
import type { SlotWithCard } from '@/types/binder'

interface BinderSpreadViewProps {
  spreads: Spread[]
  spreadIndex: number
  onSpreadChange: (index: number) => void
  coverColor: string
  gridType: GridType
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onSwap: (slotAId: string, slotBId: string) => void
  onMove: (slotId: string, pageNumber: number, slotIndex: number) => void
}

function SpreadPanelContent({
  content,
  coverColor,
  gridType,
  onDelete,
  onToggleStatus,
}: {
  content: SpreadPageContent
  coverColor: string
  gridType: GridType
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
}) {
  if (content.type === 'cover') {
    return <BinderCoverPanel coverColor={coverColor} />
  }
  if (content.type === 'blank') {
    return <div className="w-full min-h-[400px] rounded-lg bg-muted" />
  }
  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground mb-2 text-center">第 {content.pageNumber} 頁</p>
      <BinderGridSlots
        slots={content.page}
        gridType={gridType}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
      />
    </div>
  )
}

export function BinderSpreadView({
  spreads,
  spreadIndex,
  onSpreadChange,
  coverColor,
  gridType,
  onDelete,
  onToggleStatus,
  onSwap,
  onMove,
}: BinderSpreadViewProps) {
  const spread = spreads[spreadIndex]
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeSlot, setActiveSlot] = useState<SlotWithCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  // Collect all slots from the current spread (left + right) for drag lookup
  const allSlots = [
    ...(spread?.left.type === 'page' ? spread.left.page : []),
    ...(spread?.right.type === 'page' ? spread.right.page : []),
  ]

  const { handleDragMove, handleDragEnd: flipHandleDragEnd } = useEdgeHoverPageFlip({
    containerRef,
    spreadIndex,
    totalSpreads: spreads.length,
    onSpreadChange,
  })

  function handleDragStart(event: DragStartEvent) {
    const slotId = (event.active.id as string).replace('slot-', '')
    const slot = allSlots.find((s): s is SlotWithCard => s.id === slotId)
    setActiveSlot(slot ?? null)
  }

  function handleDragMoveEvent(event: DragMoveEvent) {
    handleDragMove(event)
  }

  function handleDragEnd(event: DragEndEvent) {
    flipHandleDragEnd()
    setActiveSlot(null)
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

  if (!spread) return null

  return (
    <div data-testid="binder-spread-view" className="hidden md:flex flex-col gap-4">
      <DndContext
        id="binder-spread-dnd"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMoveEvent}
        onDragEnd={handleDragEnd}
      >
        <div ref={containerRef} data-testid="spread-drag-container" className="flex gap-4">
          <div className="flex-1 border rounded-lg p-4">
            <SpreadPanelContent
              content={spread.left}
              coverColor={coverColor}
              gridType={gridType}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          </div>
          <div className="flex-1 border rounded-lg p-4">
            <SpreadPanelContent
              content={spread.right}
              coverColor={coverColor}
              gridType={gridType}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          </div>
        </div>
        <DragOverlay>
          {activeSlot ? (
            <SlotCard slot={activeSlot} onDelete={() => {}} onToggleStatus={() => {}} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          data-testid="spread-prev-btn"
          onClick={() => onSpreadChange(spreadIndex - 1)}
          disabled={spreadIndex === 0}
        >
          ← 上一頁
        </Button>
        <span className="text-sm text-muted-foreground">
          {spreadIndex + 1} / {spreads.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          data-testid="spread-next-btn"
          onClick={() => onSpreadChange(spreadIndex + 1)}
          disabled={spreadIndex === spreads.length - 1}
        >
          下一頁 →
        </Button>
      </div>
    </div>
  )
}
