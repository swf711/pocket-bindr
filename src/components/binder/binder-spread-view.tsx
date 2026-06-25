'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
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
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { BinderGridSlots } from './binder-grid'
import { BinderCoverPanel } from './binder-cover-panel'
import { SlotCard } from './slot-card'
import { useEdgeHoverPageFlip } from '@/hooks/use-edge-hover-page-flip'
import { useScaleFit } from '@/hooks/use-scale-fit'
import type { Spread, SpreadPageContent } from '@/lib/binder-utils'
import type { SlotWithCard } from '@/types/binder'
import { ButtonGroup } from '../ui/button-group'
import { IconTooltipButton } from '../common/icon-tooltip-button'

const SPREAD_NATURAL_WIDTH = 1200 // 2 × 542px panels + 16px gap; tune this to taste
const EDGE_HINT_PX = 64          // matches w-16 (Tailwind) — natural-coordinate width of drag-hint panels
const HEADER_HEIGHT = 56         // header 視覺高度（px），counter-scale 計算基準
const PAGE_LABEL_HEIGHT = 20     // text-xs 行高約 16px + mb-1 4px，counter-scale 補償基準

interface BinderSpreadViewProps {
  spreads: Spread[]
  spreadIndex: number
  onSpreadChange: (index: number) => void
  coverColor: string
  binderName: string
  description?: string | null
  slots: SlotWithCard[]
  totalPages: number
  gridType: GridType
  onDraggingChange?: (dragging: boolean) => void
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onSwap: (slotAId: string, slotBId: string) => void
  onMove: (slotId: string, pageNumber: number, slotIndex: number) => void
  onView?: (cardId: string) => void
  onCopy?: (slotId: string) => void
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  onJumpToSlot: (slot: SlotWithCard) => void
  highlightedSlotId?: string | null
  onAddPage: () => void
  settingsSlot: React.ReactNode
}

function SpreadPanelContent({
  content,
  coverColor,
  binderName,
  description,
  slots,
  totalPages,
  gridType,
  onDelete,
  onToggleStatus,
  onView,
  onCopy,
  isDragging,
  onAddCard,
  onJumpToSlot,
  highlightedSlotId,
  counterScale,
}: {
  content: SpreadPageContent
  coverColor: string
  binderName: string
  description?: string | null
  slots: SlotWithCard[]
  totalPages: number
  gridType: GridType
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onView?: (cardId: string) => void
  onCopy?: (slotId: string) => void
  isDragging: boolean
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  onJumpToSlot: (slot: SlotWithCard) => void
  highlightedSlotId?: string | null
  counterScale: number
}) {
  if (content.type === 'cover') {
    return (
      <BinderCoverPanel
        binderName={binderName}
        description={description}
        slots={slots}
        gridType={gridType}
        totalPages={totalPages}
        onJumpToSlot={onJumpToSlot}
        counterScale={counterScale}
      />
    )
  }
  if (content.type === 'blank') {
    return <div className="w-full h-full rounded-lg" style={{ backgroundColor: coverColor }} />
  }
  return (
    <div className="w-full p-4 dark bg-black">
      {/* 固定佔位高度 = 文字自然高度 × counterScale，避免 transform 不影響 layout 導致視覺溢出 */}
      <div style={{ height: PAGE_LABEL_HEIGHT * counterScale, overflow: 'visible' }}>
        <p
          className="text-xs text-muted-foreground text-center"
          style={{ transform: `scale(${counterScale})`, transformOrigin: 'top center', display: 'block' }}
        >
          第 {content.pageNumber} 頁
        </p>
      </div>
      <BinderGridSlots
        slots={content.page}
        gridType={gridType}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        onView={onView}
        onCopy={onCopy}
        isDragging={isDragging}
        onAddCard={onAddCard}
        highlightedSlotId={highlightedSlotId}
        counterScale={counterScale}
      />
    </div>
  )
}

export function BinderSpreadView({
  spreads,
  spreadIndex,
  onSpreadChange,
  coverColor,
  binderName,
  description,
  slots,
  totalPages,
  gridType,
  onDraggingChange,
  onDelete,
  onToggleStatus,
  onSwap,
  onMove,
  onView,
  onCopy,
  onAddCard,
  onJumpToSlot,
  highlightedSlotId,
  onAddPage,
  settingsSlot,
}: BinderSpreadViewProps) {
  const spread = spreads[spreadIndex]
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeSlot, setActiveSlot] = useState<SlotWithCard | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const isLastSpread = spreadIndex === spreads.length - 1

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const allSlots = [
    ...(spread?.left.type === 'page' ? spread.left.page : []),
    ...(spread?.right.type === 'page' ? spread.right.page : []),
  ]

  const { outerRef, innerRef, scale, offsetX } = useScaleFit(SPREAD_NATURAL_WIDTH)

  const { handleDragMove, handleDragEnd: flipHandleDragEnd } = useEdgeHoverPageFlip({
    containerRef,
    spreadIndex,
    totalSpreads: spreads.length,
    onSpreadChange,
    edgeWidth: Math.round(EDGE_HINT_PX * scale),
  })

  function handleDragStart(event: DragStartEvent) {
    const slotId = (event.active.id as string).replace('slot-', '')
    const slot = allSlots.find((s): s is SlotWithCard => s.id === slotId)
    setActiveSlot(slot ?? null)
    setIsDragging(true)
    onDraggingChange?.(true)
  }

  function handleDragMoveEvent(event: DragMoveEvent) {
    handleDragMove(event)
  }

  function handleDragEnd(event: DragEndEvent) {
    flipHandleDragEnd()
    setActiveSlot(null)
    setIsDragging(false)
    onDraggingChange?.(false)
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

  const hasPrev = spreadIndex > 0
  const hasNext = spreadIndex < spreads.length - 1

  // counter-scale factor：抵銷 innerRef 的 scale，使頁面標籤與格位操作按鈕維持自然視覺尺寸
  const counterScale = scale > 0 ? 1 / scale : 1
  // header 在 innerRef 自然座標系中的寬度，使其視覺寬度 = SPREAD_NATURAL_WIDTH * scale（與 panels 一致）
  const headerNaturalWidth = scale > 0 ? SPREAD_NATURAL_WIDTH * scale : SPREAD_NATURAL_WIDTH
  // 補償 counter-scale 視覺溢出，確保 panels 緊接在 header 視覺底部下方
  const dynamicSpacerHeight = scale > 0 && scale < 1 ? HEADER_HEIGHT * (1 / scale - 1) : 0

  return (
    <div data-testid="binder-spread-view" className="hidden md:flex flex-col flex-1 min-h-0">
      {/* DndContext wraps both the scaled area and DragOverlay so the overlay
          renders as a sibling — outside the CSS scale transform — letting
          position:fixed resolve against the viewport instead of the scaled ancestor */}
      <DndContext
        id="binder-spread-dnd"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMoveEvent}
        onDragEnd={handleDragEnd}
      >
        {/* Scaled area: panels fill all available height, CSS-scaled to fit */}
        <div ref={outerRef} className="flex-1 min-h-0 relative overflow-hidden">
          <div
            ref={innerRef}
            style={{
              position: 'absolute',
              width: SPREAD_NATURAL_WIDTH,
              top: 0,
              left: offsetX,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {/* Header — counter-scale 確保按鈕與文字不因 innerRef scale 縮小 */}
            <div
              className="shrink-0 flex items-center justify-between py-2"
              style={{
                transform: `scale(${counterScale})`,
                transformOrigin: 'top left',
                width: headerNaturalWidth,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: HEADER_HEIGHT,
              }}
            >
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="mr-2" asChild>
                  <Link href="/binders" aria-label="返回卡冊列表" data-testid="back-to-binders">
                    <ArrowLeft />
                    <span>返回</span>
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold">{binderName}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <ButtonGroup>
                        <IconTooltipButton
                          variant="outline"
                          size="icon-sm"
                          data-testid="spread-first-btn"
                          onClick={() => onSpreadChange(0)}
                          disabled={spreadIndex === 0 || isDragging}
                          tooltip="第一頁"
                        >
                          <ChevronsLeft />
                        </IconTooltipButton>
                        <IconTooltipButton
                          variant="outline"
                          size="icon-sm"
                          data-testid="spread-prev-btn"
                          onClick={() => onSpreadChange(spreadIndex - 1)}
                          disabled={spreadIndex === 0 || isDragging}
                          className="gap-1 px-2.5"
                          tooltip="上一頁"
                        >
                          <ChevronLeft />
                        </IconTooltipButton>
                      </ButtonGroup>
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm text-muted-foreground tabular-nums px-2">
                        {spreadIndex + 1} / {spreads.length}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <ButtonGroup>
                        {isLastSpread ? (
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid="spread-add-page-btn"
                            onClick={onAddPage}
                            disabled={isDragging}
                            aria-label="新增內頁"
                          >
                            <Plus />
                            <span>新增內頁</span>
                          </Button>
                        ) : (
                          <IconTooltipButton
                            variant="outline"
                            size="icon-sm"
                            data-testid="spread-next-btn"
                            onClick={() => onSpreadChange(spreadIndex + 1)}
                            disabled={isDragging}
                            className="gap-1 px-2.5"
                            tooltip="下一頁"
                          >
                            <ChevronRight />
                          </IconTooltipButton>
                        )}
                        <IconTooltipButton
                          variant="outline"
                          size="icon-sm"
                          data-testid="spread-last-btn"
                          onClick={() => onSpreadChange(spreads.length - 1)}
                          disabled={isLastSpread || isDragging}
                          tooltip="最後一頁"
                        >
                          <ChevronsRight />
                        </IconTooltipButton>
                      </ButtonGroup>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                {settingsSlot}
              </div>
            </div>

            {/* 補償 counter-scale 視覺溢出，讓 panels 緊接在 header 視覺底部下方 */}
            <div style={{ height: dynamicSpacerHeight }} />

            <div className="relative">
              <div ref={containerRef} data-testid="spread-drag-container" className="flex gap-4">
                <div
                  className="flex-1 rounded-lg overflow-hidden"
                  style={{ border: `4px solid ${coverColor}`, backgroundColor: coverColor }}
                >
                  <SpreadPanelContent
                    content={spread.left}
                    coverColor={coverColor}
                    binderName={binderName}
                    description={description}
                    slots={slots}
                    totalPages={totalPages}
                    gridType={gridType}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    onView={onView}
                    onCopy={onCopy}
                    isDragging={isDragging}
                    onAddCard={onAddCard}
                    onJumpToSlot={onJumpToSlot}
                    highlightedSlotId={highlightedSlotId}
                    counterScale={counterScale}
                  />
                </div>
                <div
                  className="flex-1 rounded-lg overflow-hidden"
                  style={{ border: `4px solid ${coverColor}`, backgroundColor: coverColor }}
                >
                  <SpreadPanelContent
                    content={spread.right}
                    coverColor={coverColor}
                    binderName={binderName}
                    description={description}
                    slots={slots}
                    totalPages={totalPages}
                    gridType={gridType}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    onView={onView}
                    onCopy={onCopy}
                    isDragging={isDragging}
                    onAddCard={onAddCard}
                    onJumpToSlot={onJumpToSlot}
                    highlightedSlotId={highlightedSlotId}
                    counterScale={counterScale}
                  />
                </div>
              </div>

              {/* Drag hint panels — shown only while dragging */}
              {isDragging && hasPrev && (
                <div
                  className="dark absolute left-0 top-0 bottom-0 text-primary/80 w-16 flex flex-col items-center justify-center gap-1 bg-black/50 border-2 border-dashed border-primary/80 rounded-l-lg pointer-events-none"
                  data-testid="drag-hint-prev"
                >
                  <div style={{ transform: `scale(${counterScale})`, transformOrigin: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <ChevronLeft />
                    <span style={{ writingMode: 'vertical-rl' }}>
                      拖到此處翻頁
                    </span>
                    <ChevronLeft />
                  </div>
                </div>
              )}
              {isDragging && hasNext && (
                <div
                  className="dark absolute right-0 top-0 bottom-0 text-primary/80 w-16 flex flex-col items-center justify-center gap-1 bg-black/50 border-2 border-dashed border-primary/80 rounded-r-lg pointer-events-none"
                  data-testid="drag-hint-next"
                >
                  <div style={{ transform: `scale(${counterScale})`, transformOrigin: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <ChevronRight />
                    <span style={{ writingMode: 'vertical-rl' }}>
                      拖到此處翻頁
                    </span>
                    <ChevronRight />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Left side nav — 緊鄰 innerRef 左側，offsetX 確保對齊縮放後的卡冊邊緣 */}
          {!isDragging && hasPrev && (
            <Button
              variant="outline"
              size="icon"
              style={{ position: 'absolute', left: offsetX - 44, top: '50%', transform: 'translateY(-50%)' }}
              className="z-20"
              onClick={() => onSpreadChange(spreadIndex - 1)}
              aria-label="上一頁"
              data-testid="spread-side-prev-btn"
            >
              <ChevronLeft />
            </Button>
          )}
          {/* Right side nav — 末頁改為新增內頁（同 header pagination 邏輯） */}
          {!isDragging && (
            <Button
              variant="outline"
              size="icon"
              style={{ position: 'absolute', right: offsetX - 44, top: '50%', transform: 'translateY(-50%)' }}
              className="z-20"
              onClick={isLastSpread ? onAddPage : () => onSpreadChange(spreadIndex + 1)}
              aria-label={isLastSpread ? '新增內頁' : '下一頁'}
              data-testid="spread-side-next-btn"
            >
              {isLastSpread ? <Plus /> : <ChevronRight />}
            </Button>
          )}
        </div>

        <DragOverlay>
          {activeSlot ? (
            <SlotCard slot={activeSlot} onDelete={() => { }} onToggleStatus={() => { }} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
