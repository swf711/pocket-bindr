'use client'

import { useState } from 'react'
import { GridType } from '@prisma/client'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { ReadOnlySlotCard } from './read-only-slot-card'
import { buildGridPages, buildSpreads, buildMobilePages } from '@/lib/binder-utils'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { BinderPublicData } from '@/types/binder'
import type { BinderSlotItem, SlotWithCard } from '@/types/binder'

const GRID_COLS: Record<GridType, number> = {
  grid_1x2: 1,
  grid_2x2: 2,
  grid_3x3: 3,
  grid_4x3: 4,
  grid_4x4: 4,
}

function ReadOnlyGrid({ slots, gridType }: { slots: BinderSlotItem[]; gridType: GridType }) {
  const cols = GRID_COLS[gridType]
  return (
    <div
      className="grid gap-2 w-full"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {slots.map((item, i) =>
        item.id !== null ? (
          <ReadOnlySlotCard key={item.id} slot={item as SlotWithCard} />
        ) : (
          <div
            key={`empty-${i}`}
            className="w-full aspect-5/7 rounded-md border border-dashed border-border bg-muted/30"
          />
        )
      )}
    </div>
  )
}

function PagePanel({
  content,
  coverColor,
  gridType,
}: {
  content: ReturnType<typeof buildMobilePages>[number]
  coverColor: string
  gridType: GridType
}) {
  if (content.type === 'cover' || content.type === 'blank') {
    return (
      <div
        className="flex-1 rounded-md border border-border min-h-48"
        style={{ backgroundColor: coverColor }}
      />
    )
  }
  return (
    <div className="flex-1 rounded-md border border-border p-2 bg-background">
      <ReadOnlyGrid slots={content.page} gridType={gridType} />
    </div>
  )
}

export function BinderPublicView({ binder }: { binder: BinderPublicData }) {
  const isMobile = useIsMobile()
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [mobilePageIndex, setMobilePageIndex] = useState(0)

  const gridType = binder.gridType as GridType
  const totalPages = binder.settings?.totalPages ?? 1
  const pages = buildGridPages(binder.slots, gridType, totalPages)
  const pagesArray = Array.from({ length: totalPages }, (_, i) => pages.get(i + 1) ?? [])
  const spreads = buildSpreads(pagesArray)
  const mobilePages = buildMobilePages(pagesArray)

  if (isMobile) {
    const page = mobilePages[mobilePageIndex]
    return (
      <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
        <OwnerBanner ownerName={binder.ownerName} binderName={binder.name} description={binder.description} />
        <PagePanel content={page} coverColor={binder.coverColor} gridType={gridType} />
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button variant="outline" size="icon" onClick={() => setMobilePageIndex(0)} disabled={mobilePageIndex === 0} aria-label="首頁">
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button variant="outline" size="icon" onClick={() => setMobilePageIndex(i => i - 1)} disabled={mobilePageIndex === 0} aria-label="上一頁">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-sm text-muted-foreground">
                {mobilePageIndex + 1} / {mobilePages.length}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button variant="outline" size="icon" onClick={() => setMobilePageIndex(i => i + 1)} disabled={mobilePageIndex === mobilePages.length - 1} aria-label="下一頁">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button variant="outline" size="icon" onClick={() => setMobilePageIndex(mobilePages.length - 1)} disabled={mobilePageIndex === mobilePages.length - 1} aria-label="末頁">
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  const spread = spreads[spreadIndex]
  return (
    <div className="flex flex-col gap-4 p-6 max-w-5xl mx-auto">
      <OwnerBanner ownerName={binder.ownerName} binderName={binder.name} description={binder.description} />
      <div className="flex gap-4">
        <PagePanel content={spread.left} coverColor={binder.coverColor} gridType={gridType} />
        <PagePanel content={spread.right} coverColor={binder.coverColor} gridType={gridType} />
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button variant="outline" size="icon" onClick={() => setSpreadIndex(0)} disabled={spreadIndex === 0} aria-label="首頁">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button variant="outline" size="icon" onClick={() => setSpreadIndex(i => i - 1)} disabled={spreadIndex === 0} aria-label="上一頁">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span className="px-3 text-sm text-muted-foreground">
              {spreadIndex + 1} / {spreads.length}
            </span>
          </PaginationItem>
          <PaginationItem>
            <Button variant="outline" size="icon" onClick={() => setSpreadIndex(i => i + 1)} disabled={spreadIndex === spreads.length - 1} aria-label="下一頁">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button variant="outline" size="icon" onClick={() => setSpreadIndex(spreads.length - 1)} disabled={spreadIndex === spreads.length - 1} aria-label="末頁">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function OwnerBanner({ ownerName, binderName, description }: { ownerName: string; binderName: string; description: string | null }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground" data-testid="public-owner-banner">
        {ownerName} 的卡冊
      </p>
      <h1 className="text-2xl font-bold">{binderName}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}
