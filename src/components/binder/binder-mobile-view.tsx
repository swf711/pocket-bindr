'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GridType } from '@prisma/client'
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { BinderGridSlots } from './binder-grid'
import { SlotCard } from './slot-card'
import { BinderCoverPanel } from './binder-cover-panel'
import { useScaleFit } from '@/hooks/use-scale-fit'
import { useEdgeHoverPageFlip } from '@/hooks/use-edge-hover-page-flip'
import type { SpreadPageContent } from '@/lib/binder-utils'
import type { SlotWithCard } from '@/types/binder'

const MOBILE_PAGE_NATURAL_WIDTH = 767 // 行動裝置單頁自然寬度（px），Snowglobe 縮放基準
const PAGE_LABEL_HEIGHT = 20           // text-xs 行高約 16px + mb-1 4px，counter-scale 補償基準
const EDGE_HINT_PX = 64               // 拖拉翻頁邊緣提示區寬度（px，與 w-16 一致）

interface BinderMobileViewProps {
  mobilePages: SpreadPageContent[]
  pageIndex: number
  onPageChange: (index: number) => void
  coverColor: string
  binderName: string
  description?: string | null
  slots: SlotWithCard[]
  totalPages: number
  gridType: GridType
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onSwap: (slotAId: string, slotBId: string) => void
  onMove: (slotId: string, pageNumber: number, slotIndex: number) => void
  onView?: (cardId: string) => void
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  onJumpToSlot: (slot: SlotWithCard) => void
  highlightedSlotId?: string | null
  onAddPage: () => void
  settingsSlot: React.ReactNode
}

export function BinderMobileView({
  mobilePages,
  pageIndex,
  onPageChange,
  coverColor,
  binderName,
  description,
  slots,
  totalPages,
  gridType,
  onDelete,
  onToggleStatus,
  onSwap,
  onMove,
  onView,
  onAddCard,
  onJumpToSlot,
  highlightedSlotId,
  onAddPage,
  settingsSlot,
}: BinderMobileViewProps) {
  const content = mobilePages[pageIndex]
  const isLastMobilePage = pageIndex === mobilePages.length - 1

  const { outerRef, innerRef, scale, offsetX } = useScaleFit(MOBILE_PAGE_NATURAL_WIDTH)
  const counterScale = scale > 0 ? 1 / scale : 1

  const [activeSlot, setActiveSlot] = useState<SlotWithCard | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [tappedSlotId, setTappedSlotId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  const { handleDragMove: flipHandleDragMove, handleDragEnd: flipHandleDragEnd } =
    useEdgeHoverPageFlip({
      containerRef: outerRef as React.RefObject<HTMLElement | null>,
      spreadIndex: pageIndex,
      totalSpreads: mobilePages.length,
      onSpreadChange: onPageChange,
      edgeWidth: EDGE_HINT_PX,
    })

  function handleDragStart(event: DragStartEvent) {
    if (content?.type !== 'page') return
    const slotId = (event.active.id as string).replace('slot-', '')
    const slot = content.page.find((s): s is SlotWithCard => s.id === slotId)
    setActiveSlot(slot ?? null)
    setIsDragging(true)
  }

  function handleDragMoveEvent(event: DragMoveEvent) {
    flipHandleDragMove(event)
  }

  function handleDragEnd(event: DragEndEvent) {
    flipHandleDragEnd()
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

  function handleTapSlot(key: string) {
    if (!isDragging) {
      setTappedSlotId(prev => prev === key ? null : key)
    }
  }

  if (!content) return null

  const hasPrev = pageIndex > 0
  const hasNext = !isLastMobilePage

  return (
    <div
      data-testid="binder-mobile-view"
      className="md:hidden flex flex-col flex-1 min-h-0"
      onClick={() => { if (!isDragging) setTappedSlotId(null) }}
    >
      {/* 行動裝置 header — shrink-0，不受 Snowglobe scale 影響 */}
      <div className="shrink-0 flex items-center justify-between py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/binders" aria-label="返回卡冊列表" data-testid="back-to-binders-mobile">
              <ChevronLeft className="h-4 w-4" />
              <span>返回</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{binderName}</h1>
        </div>
        {settingsSlot}
      </div>

      {/* DndContext wraps both the scaled area and DragOverlay so the overlay
          renders as a sibling — outside the CSS scale transform — letting
          position:fixed resolve against the viewport instead of the scaled ancestor */}
      <DndContext
        id="binder-mobile-dnd"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMoveEvent}
        onDragEnd={handleDragEnd}
      >
        {/* Snowglobe 縮放區：card grid 縮放至可用高度內，不產生 scroll */}
        <div
          ref={outerRef}
          className="flex-1 min-h-0 relative overflow-hidden"
        >
          <div
            ref={innerRef}
            className="rounded-lg"
            style={{
              position: 'absolute',
              width: MOBILE_PAGE_NATURAL_WIDTH,
              top: 0,
              left: offsetX,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              border: `4px solid ${coverColor}`,
              backgroundColor: coverColor
            }}
          >
            {content.type === 'cover' && (
              <div style={{ width: MOBILE_PAGE_NATURAL_WIDTH, aspectRatio: '5/7' }}>
                <BinderCoverPanel
                  binderName={binderName}
                  description={description}
                  slots={slots}
                  gridType={gridType}
                  totalPages={totalPages}
                  onJumpToSlot={onJumpToSlot}
                  counterScale={counterScale}
                />
              </div>
            )}
            {content.type === 'blank' && (
              <div
                className="rounded-lg"
                style={{ width: MOBILE_PAGE_NATURAL_WIDTH, aspectRatio: '5/7', backgroundColor: coverColor }}
              />
            )}
            {content.type === 'page' && (
              <div className="p-4 bg-black">
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
                  isDragging={isDragging}
                  onAddCard={onAddCard}
                  highlightedSlotId={highlightedSlotId}
                  counterScale={counterScale}
                  tappedSlotId={tappedSlotId}
                  onTapSlot={handleTapSlot}
                />
              </div>
            )}
          </div>

          {/* Mobile Left side nav button — 位於 outerRef 內，不受 innerRef scale 影響 */}
          {!isDragging && hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-background/40 hover:bg-background/80 backdrop-blur-sm"
              onClick={() => onPageChange(pageIndex - 1)}
              aria-label="上一頁"
              data-testid="mobile-side-prev-btn"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {/* Mobile Right side nav button — 最後一頁不顯示（底部 pagination 已有新增按鈕） */}
          {!isDragging && !isLastMobilePage && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-background/40 hover:bg-background/80 backdrop-blur-sm"
              onClick={() => onPageChange(pageIndex + 1)}
              aria-label="下一頁"
              data-testid="mobile-side-next-btn"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}

          {/* 拖拉邊緣翻頁提示 — 位於 outerRef 內（不受 scale 影響） */}
          {isDragging && hasPrev && (
            <div
              className="absolute left-0 top-0 bottom-0 w-16 flex flex-col items-center justify-center gap-1 bg-primary/10 border-2 border-dashed border-primary/40 rounded-l-lg pointer-events-none z-10"
              data-testid="mobile-drag-hint-prev"
            >
              <ChevronLeft className="h-5 w-5 text-primary/60" />
              <span
                className="text-[10px] text-primary/60 leading-tight"
                style={{ writingMode: 'vertical-rl' }}
              >
                拖到此處翻頁
              </span>
            </div>
          )}
          {isDragging && hasNext && (
            <div
              className="absolute right-0 top-0 bottom-0 w-16 flex flex-col items-center justify-center gap-1 bg-primary/10 border-2 border-dashed border-primary/40 rounded-r-lg pointer-events-none z-10"
              data-testid="mobile-drag-hint-next"
            >
              <ChevronRight className="h-5 w-5 text-primary/60" />
              <span
                className="text-[10px] text-primary/60 leading-tight"
                style={{ writingMode: 'vertical-rl' }}
              >
                拖到此處翻頁
              </span>
            </div>
          )}
        </div>

        {/* DragOverlay 在 innerRef 外，不受 CSS scale 影響，overlay 位置與手指對齊 */}
        <DragOverlay>
          {activeSlot ? (
            <SlotCard slot={activeSlot} onDelete={() => {}} onToggleStatus={() => {}} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Pagination — 固定於卡冊下方 */}
      <div className="shrink-0 flex items-center justify-center py-2">
        <Pagination className="w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                data-testid="mobile-first-btn"
                onClick={() => onPageChange(0)}
                disabled={pageIndex === 0}
                aria-label="第一頁"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                data-testid="mobile-prev-btn"
                onClick={() => onPageChange(pageIndex - 1)}
                disabled={pageIndex === 0}
                className="gap-1 px-2.5"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">上一頁</span>
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm text-muted-foreground tabular-nums px-1">
                {pageIndex + 1} / {mobilePages.length}
              </span>
            </PaginationItem>
            <PaginationItem>
              {isLastMobilePage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="mobile-add-page-btn"
                  onClick={onAddPage}
                  aria-label="新增內頁"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="mobile-next-btn"
                  onClick={() => onPageChange(pageIndex + 1)}
                  className="gap-1 px-2.5"
                >
                  <span className="hidden sm:inline">下一頁</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                data-testid="mobile-last-btn"
                onClick={() => onPageChange(mobilePages.length - 1)}
                disabled={isLastMobilePage}
                aria-label="最後一頁"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
