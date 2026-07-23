'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus } from 'lucide-react'
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
import { ButtonGroup } from '../ui/button-group'
import { IconTooltipButton } from '../common/icon-tooltip-button'

const MOBILE_PAGE_NATURAL_WIDTH = 767 // 行動裝置單頁自然寬度（px），Snowglobe 縮放基準
const PAGE_LABEL_HEIGHT = 20           // text-xs 行高約 16px + mb-1 4px，counter-scale 補償基準
const EDGE_HINT_PX = 64               // 拖拉翻頁邊緣提示區寬度（px，與 w-16 一致）
const HEADER_HEIGHT = 56
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
  onCopy?: (slotId: string) => void
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  onJumpToSlot: (slot: SlotWithCard) => void
  highlightedSlotId?: string | null
  onAddPage: () => void
  settingsSlot: React.ReactNode
  refreshSlot?: React.ReactNode
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
  onCopy,
  onAddCard,
  onJumpToSlot,
  highlightedSlotId,
  onAddPage,
  settingsSlot,
  refreshSlot,
}: BinderMobileViewProps) {
  const t = useTranslations('binder')
  const content = mobilePages[pageIndex]
  const isLastMobilePage = pageIndex === mobilePages.length - 1

  const { outerRef, innerRef, scale, offsetX, innerH } = useScaleFit(MOBILE_PAGE_NATURAL_WIDTH)
  // hint panel 高度：卡冊視覺高度扣除 header（HEADER_HEIGHT，固定 56px，不隨 scale 縮放）
  const hintHeight = innerH > 0 ? Math.max(0, innerH * scale - HEADER_HEIGHT) : undefined
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
      canFlipPrev: pageIndex > 1, // 封面後第一頁左側不可翻（封面無卡牌 slot）
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

  function resetDragState() {
    flipHandleDragEnd()
    setActiveSlot(null)
    setIsDragging(false)
    setTappedSlotId(null)
  }

  function handleDragCancel() {
    resetDragState()
  }

  function handleDragEnd(event: DragEndEvent) {
    resetDragState()
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

  // header 在 innerRef 自然座標系中的寬度，使其視覺寬度 = MOBILE_PAGE_NATURAL_WIDTH * scale（與 panels 一致）
  const headerNaturalWidth = scale > 0 ? MOBILE_PAGE_NATURAL_WIDTH * scale : MOBILE_PAGE_NATURAL_WIDTH
  // 補償 counter-scale 視覺溢出，確保 panels 緊接在 header 視覺底部下方
  const dynamicSpacerHeight = scale > 0 && scale < 1 ? HEADER_HEIGHT * (1 / scale - 1) : 0

  return (
    <div
      data-testid="binder-mobile-view"
      className="md:hidden flex flex-col flex-1 min-h-0"
      onClick={() => { if (!isDragging) setTappedSlotId(null) }}
    >
      {/* DndContext wraps both the scaled area and DragOverlay so the overlay
          renders as a sibling — outside the CSS scale transform — letting
          position:fixed resolve against the viewport instead of the scaled ancestor */}
      <DndContext
        id="binder-mobile-dnd"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMoveEvent}
        onDragCancel={handleDragCancel}
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
            }}
          >
            {/* 行動裝置 header — shrink-0，不受 Snowglobe scale 影響 */}
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
                <Button variant="outline" size="lg" className="mr-2" asChild>
                  <Link href="/binders" aria-label={t('backToList')} data-testid="back-to-binders-mobile">
                    <ChevronLeft className="size-4" />
                    <span>{t('back')}</span>
                  </Link>
                </Button>
                <h1 className="text-xl font-bold">{binderName}</h1>
              </div>
              <div className="flex items-center gap-1">
                {refreshSlot}
                {settingsSlot}
              </div>
            </div>

            {/* 補償 counter-scale 視覺溢出，讓 panels 緊接在 header 視覺底部下方 */}
            <div style={{ height: dynamicSpacerHeight }} />

            <div
              className="flex-1 rounded-lg overflow-hidden"
              style={{
                border: `4px solid ${coverColor}`,
                backgroundColor: coverColor
              }}>

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
                <div className="p-4 dark bg-surface-container text-foreground">
                  {/* 固定佔位高度 = 文字自然高度 × counterScale，避免 transform 不影響 layout 導致視覺溢出 */}
                  <div style={{ height: PAGE_LABEL_HEIGHT * counterScale, overflow: 'visible' }}>
                    <p
                      className="text-xs text-muted-foreground text-center"
                      style={{ transform: `scale(${counterScale})`, transformOrigin: 'top center', display: 'block' }}
                    >
                      {t('pageLabel', { page: content.pageNumber })}
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
                    tappedSlotId={tappedSlotId}
                    onTapSlot={handleTapSlot}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Left side nav — 緊鄰 innerRef 左側，同桌面版樣式與末頁邏輯 */}
          {!isDragging && hasPrev && (
            <Button
              variant="outline"
              size="icon-lg"
              style={{ position: 'absolute', left: offsetX - 50, top: '50%', transform: 'translateY(-50%)' }}
              className="z-20"
              onClick={() => onPageChange(pageIndex - 1)}
              aria-label={t('prevPage')}
              data-testid="mobile-side-prev-btn"
            >
              <ChevronLeft />
            </Button>
          )}
          {/* Right side nav — 末頁改為新增內頁（同 pagination 與桌面邏輯） */}
          {!isDragging && (
            <Button
              variant="outline"
              size="icon-lg"
              style={{ position: 'absolute', right: offsetX - 50, top: '50%', transform: 'translateY(-50%)' }}
              className="z-20"
              onClick={isLastMobilePage ? onAddPage : () => onPageChange(pageIndex + 1)}
              aria-label={isLastMobilePage ? t('addPage') : t('nextPage')}
              data-testid="mobile-side-next-btn"
            >
              {isLastMobilePage ? <Plus /> : <ChevronRight />}
            </Button>
          )}

          {/* 拖拉邊緣翻頁提示 — 位於 outerRef 內（不受 scale 影響）；高度限制在卡冊視覺高度內 */}
          {isDragging && pageIndex > 1 && (
            <div
              style={{ top: HEADER_HEIGHT, height: hintHeight ?? '100%' }}
              className="dark absolute left-0 w-12 text-primary flex flex-col items-center justify-center gap-1 bg-surface-container/60 border-2 border-dashed border-primary rounded-l-lg pointer-events-none z-10"
              data-testid="mobile-drag-hint-prev"
            >
              <ChevronLeft />
              <span
                style={{ writingMode: 'vertical-rl' }}
              >
                {t('dragToFlip')}
              </span>
              <ChevronLeft />
            </div>
          )}
          {isDragging && hasNext && (
            <div
              style={{ top: HEADER_HEIGHT, height: hintHeight ?? '100%' }}
              className="dark absolute right-0 w-12 text-primary flex flex-col items-center justify-center gap-1 bg-surface-container/60 border-2 border-dashed border-primary rounded-r-lg pointer-events-none z-10"
              data-testid="mobile-drag-hint-next"
            >
              <ChevronRight />
              <span
                style={{ writingMode: 'vertical-rl' }}
              >
                {t('dragToFlip')}
              </span>
              <ChevronRight />
            </div>
          )}
        </div>

        {/* DragOverlay 在 innerRef 外，不受 CSS scale 影響，overlay 位置與手指對齊 */}
        <DragOverlay>
          {activeSlot ? (
            <SlotCard slot={activeSlot} onDelete={() => { }} onToggleStatus={() => { }} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Pagination — 固定於卡冊下方 */}
      <div className="shrink-0 flex items-center justify-center py-2">
        <Pagination className="w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <ButtonGroup>
                <IconTooltipButton
                  variant="outline"
                  size="icon-lg"
                  data-testid="mobile-first-btn"
                  onClick={() => onPageChange(0)}
                  disabled={pageIndex === 0}
                  tooltip={t('firstPage')}
                >
                  <ChevronsLeft />
                </IconTooltipButton>
                <IconTooltipButton
                  variant="outline"
                  size="icon-lg"
                  data-testid="mobile-prev-btn"
                  onClick={() => onPageChange(pageIndex - 1)}
                  disabled={pageIndex === 0}
                  className="gap-1 px-2.5"
                  tooltip={t('prevPage')}
                >
                  <ChevronLeft />
                </IconTooltipButton>
              </ButtonGroup>
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm text-muted-foreground tabular-nums px-1">
                {pageIndex + 1} / {mobilePages.length}
              </span>
            </PaginationItem>
            <PaginationItem>
              <ButtonGroup>
                {isLastMobilePage ? (
                  <Button
                    variant="outline"
                    size="icon-lg"
                    data-testid="mobile-add-page-btn"
                    onClick={onAddPage}
                    aria-label={t('addPage')}
                  >
                    <Plus />
                  </Button>
                ) : (
                  <IconTooltipButton
                    variant="outline"
                    size="icon-lg"
                    data-testid="mobile-next-btn"
                    onClick={() => onPageChange(pageIndex + 1)}
                    className="gap-1 px-2.5"
                    tooltip={t('nextPage')}
                  >
                    <ChevronRight />
                  </IconTooltipButton>
                )}
                <IconTooltipButton
                  variant="outline"
                  size="icon-lg"
                  data-testid="mobile-last-btn"
                  onClick={() => onPageChange(mobilePages.length - 1)}
                  disabled={isLastMobilePage}
                  tooltip={t('lastPage')}
                >
                  <ChevronsRight />
                </IconTooltipButton>
              </ButtonGroup>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
