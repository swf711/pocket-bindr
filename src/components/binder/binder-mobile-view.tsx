'use client'

import { useRef } from 'react'
import { GridType } from '@prisma/client'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BinderGrid } from './binder-grid'
import { BinderCoverPanel } from './binder-cover-panel'
import type { SpreadPageContent } from '@/lib/binder-utils'

interface BinderMobileViewProps {
  mobilePages: SpreadPageContent[]
  pageIndex: number
  onPageChange: (index: number) => void
  coverColor: string
  gridType: GridType
  onAddPage: () => void
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onSwap: (slotAId: string, slotBId: string) => void
  onMove: (slotId: string, pageNumber: number, slotIndex: number) => void
  onAddCard?: (pageNumber: number, slotIndex: number) => void
}

export function BinderMobileView({
  mobilePages,
  pageIndex,
  onPageChange,
  coverColor,
  gridType,
  onAddPage,
  onDelete,
  onToggleStatus,
  onSwap,
  onMove,
  onAddCard,
}: BinderMobileViewProps) {
  const touchStartX = useRef<number | null>(null)
  const content = mobilePages[pageIndex]
  const isLastPage = pageIndex === mobilePages.length - 1

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
      className="md:hidden flex flex-col gap-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="rounded-lg p-4 bg-black" style={{ border: `2px solid ${coverColor}` }}>
        {content.type === 'cover' && <BinderCoverPanel coverColor={coverColor} />}
        {content.type === 'blank' && <div className="w-full min-h-75 rounded-lg bg-muted" />}
        {content.type === 'page' && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 text-center">第 {content.pageNumber} 頁</p>
            <BinderGrid
              slots={content.page}
              gridType={gridType}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              onSwap={onSwap}
              onMove={onMove}
              onAddCard={onAddCard}
            />
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          data-testid="mobile-prev-btn"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0}
        >
          ← 上一頁
        </Button>
        <span className="text-sm text-muted-foreground">
          {pageIndex + 1} / {mobilePages.length}
        </span>
        {isLastPage ? (
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
      </div>
    </div>
  )
}
