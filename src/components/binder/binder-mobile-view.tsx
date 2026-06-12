'use client'

import { useRef } from 'react'
import { GridType } from '@prisma/client'
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
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onSwap: (slotAId: string, slotBId: string) => void
  onMove: (slotId: string, pageNumber: number, slotIndex: number) => void
}

export function BinderMobileView({
  mobilePages,
  pageIndex,
  onPageChange,
  coverColor,
  gridType,
  onDelete,
  onToggleStatus,
  onSwap,
  onMove,
}: BinderMobileViewProps) {
  const touchStartX = useRef<number | null>(null)
  const content = mobilePages[pageIndex]

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
      <div className="border rounded-lg p-4">
        {content.type === 'cover' && <BinderCoverPanel coverColor={coverColor} />}
        {content.type === 'blank' && <div className="w-full min-h-[300px] rounded-lg bg-muted" />}
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
        <Button
          variant="outline"
          size="sm"
          data-testid="mobile-next-btn"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex === mobilePages.length - 1}
        >
          下一頁 →
        </Button>
      </div>
    </div>
  )
}
