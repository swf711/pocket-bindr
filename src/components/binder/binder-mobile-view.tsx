'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { GridType } from '@prisma/client'
import { ChevronLeft, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BinderGrid } from './binder-grid'
import { BinderCoverPanel } from './binder-cover-panel'
import { useScaleFit } from '@/hooks/use-scale-fit'
import type { SpreadPageContent } from '@/lib/binder-utils'
import type { SlotWithCard } from '@/types/binder'

const MOBILE_PAGE_NATURAL_WIDTH = 400 // 行動裝置單頁自然寬度（px），Snowglobe 縮放基準

interface BinderMobileViewProps {
  mobilePages: SpreadPageContent[]
  pageIndex: number
  onPageChange: (index: number) => void
  coverColor: string
  binderName: string
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
  const touchStartX = useRef<number | null>(null)
  const content = mobilePages[pageIndex]
  const isLastMobilePage = pageIndex === mobilePages.length - 1

  const { outerRef, innerRef, scale, offsetX, offsetY } = useScaleFit(MOBILE_PAGE_NATURAL_WIDTH)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -50 && pageIndex < mobilePages.length - 1) {
      onPageChange(pageIndex + 1)
    } else if (dx > 50 && pageIndex > 0) {
      onPageChange(pageIndex - 1)
    }
  }

  if (!content) return null

  return (
    <div
      data-testid="binder-mobile-view"
      className="md:hidden flex flex-col flex-1 min-h-0"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 行動裝置 header — shrink-0，不進 innerRef，不受 Snowglobe scale 影響 */}
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            data-testid="mobile-prev-btn"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            ← 上一頁
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {pageIndex + 1} / {mobilePages.length}
          </span>
          {isLastMobilePage ? (
            <Button
              variant="outline"
              size="sm"
              data-testid="mobile-add-page-btn"
              onClick={onAddPage}
              aria-label="新增內頁"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              data-testid="mobile-next-btn"
              onClick={() => onPageChange(pageIndex + 1)}
            >
              下一頁 →
            </Button>
          )}
          {settingsSlot}
        </div>
      </div>

      {/* Snowglobe 縮放區：card grid 縮放至可用高度內，不產生 scroll */}
      <div
        ref={outerRef}
        className="flex-1 min-h-0 relative overflow-hidden rounded-lg"
        style={{ border: `4px solid ${coverColor}` }}
      >
        <div
          ref={innerRef}
          style={{
            position: 'absolute',
            width: MOBILE_PAGE_NATURAL_WIDTH,
            top: offsetY,
            left: offsetX,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {content.type === 'cover' && (
            <BinderCoverPanel
              binderName={binderName}
              slots={slots}
              gridType={gridType}
              totalPages={totalPages}
              onJumpToSlot={onJumpToSlot}
            />
          )}
          {content.type === 'blank' && (
            <div
              className="rounded-lg bg-muted"
              style={{ width: MOBILE_PAGE_NATURAL_WIDTH, aspectRatio: '5/7' }}
            />
          )}
          {content.type === 'page' && (
            <div className="p-4 bg-black">
              <p className="text-xs text-muted-foreground mb-1 text-center">第 {content.pageNumber} 頁</p>
              <BinderGrid
                slots={content.page}
                gridType={gridType}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
                onSwap={onSwap}
                onMove={onMove}
                onView={onView}
                onAddCard={onAddCard}
                highlightedSlotId={highlightedSlotId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
