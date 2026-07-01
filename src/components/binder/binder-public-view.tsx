'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { GridType } from '@prisma/client'
import { toast } from 'sonner'
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { ButtonGroup } from '@/components/ui/button-group'
import { IconTooltipButton } from '@/components/common/icon-tooltip-button'
import { ReadOnlySlotCard } from './read-only-slot-card'
import { CardDetailDrawer } from '@/components/cards/card-detail-drawer'
import { useScaleFit } from '@/hooks/use-scale-fit'
import { useAddToBinder } from '@/hooks/use-add-to-binder'
import {
  buildGridPages,
  buildSpreads,
  buildMobilePages,
} from '@/lib/binder-utils'
import type { BinderPublicData, BinderSlotItem, SlotWithCard } from '@/types/binder'
import type { CardWithCollectionStatus } from '@/types/card'
import type { SpreadPageContent } from '@/lib/binder-utils'
import type { CardStatus } from '@prisma/client'

const SPREAD_NATURAL_WIDTH = 1200
const MOBILE_PAGE_NATURAL_WIDTH = 767
const HEADER_HEIGHT = 56
const PAGE_LABEL_HEIGHT = 20

// ─── 唯讀格位 grid（無 DnD，無操作按鈕）────────────────────────────────────────

function ReadOnlyGridSlots({
  slots,
  gridType,
  onView,
}: {
  slots: BinderSlotItem[]
  gridType: GridType
  onView?: (cardId: string) => void
}) {
  const GRID_COLS: Record<GridType, number> = {
    grid_1x2: 1,
    grid_2x2: 2,
    grid_3x3: 3,
    grid_4x3: 4,
    grid_4x4: 4,
  }
  const cols = GRID_COLS[gridType]
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {slots.map((slot, i) => {
        const emptyKey = `empty-${slot.pageNumber}-${slot.slotIndex}-${i}`
        return slot.id !== null ? (
          <ReadOnlySlotCard key={slot.id} slot={slot as SlotWithCard} onView={onView} />
        ) : (
          <div
            key={emptyKey}
            className="w-full aspect-5/7 rounded-md border border-dashed border-border bg-muted/30"
          />
        )
      })}
    </div>
  )
}

// ─── 封面資訊（卡冊名稱 + 描述，樣式比照 BinderCoverPanel）──────────────────────

const COVER_NAME_HEIGHT = 40       // 與 BinderCoverPanel BINDER_NAME_HEIGHT 一致
const COVER_DESC_HEIGHT = 25       // 與 BinderCoverPanel DESCRIPTION_LINE_HEIGHT 一致

function CoverLabel({
  binderName,
  description,
  counterScale,
}: {
  binderName: string
  description?: string | null
  counterScale: number
}) {
  return (
    <div className="p-4">
      <div className="dark text-white bg-black/50 rounded-md p-4 flex flex-col gap-2">
        <div style={{ height: COVER_NAME_HEIGHT * counterScale, overflow: 'visible' }}>
          <h1
            className="text-4xl font-black truncate text-center select-none break-all"
            style={{
              transform: `scale(${counterScale})`,
              transformOrigin: 'top left',
              display: 'block',
              width: `${100 / counterScale}%`,
            }}
          >
            {binderName}
          </h1>
        </div>
        {description && (
          <div style={{ height: COVER_DESC_HEIGHT * counterScale, overflow: 'visible' }}>
            <p
              className="text-sm text-muted-foreground truncate text-center"
              style={{
                transform: `scale(${counterScale})`,
                transformOrigin: 'top left',
                display: 'block',
                width: `${100 / counterScale}%`,
              }}
            >
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 面板內容（封面 / 空白 → coverColor；內頁 → grid）──────────────────────────

function PublicPanelContent({
  content,
  coverColor,
  gridType,
  counterScale,
  mobileWrapper,
  binderName,
  description,
  onView,
}: {
  content: SpreadPageContent
  coverColor: string
  gridType: GridType
  counterScale: number
  mobileWrapper?: boolean
  binderName: string
  description?: string | null
  onView?: (cardId: string) => void
}) {
  const t = useTranslations('binder')
  if (content.type === 'cover') {
    if (mobileWrapper) {
      return (
        <div
          className="rounded-lg flex flex-col justify-center overflow-hidden"
          style={{
            width: MOBILE_PAGE_NATURAL_WIDTH,
            aspectRatio: '5/7',
            backgroundColor: coverColor,
          }}
        >
          <CoverLabel binderName={binderName} description={description} counterScale={counterScale} />
        </div>
      )
    }
    return (
      <div className="w-full h-full rounded-lg flex flex-col justify-center" style={{ backgroundColor: coverColor }}>
        <CoverLabel binderName={binderName} description={description} counterScale={counterScale} />
      </div>
    )
  }

  if (content.type === 'blank') {
    if (mobileWrapper) {
      return (
        <div
          className="rounded-lg"
          style={{
            width: MOBILE_PAGE_NATURAL_WIDTH,
            aspectRatio: '5/7',
            backgroundColor: coverColor,
          }}
        />
      )
    }
    return <div className="w-full h-full rounded-lg" style={{ backgroundColor: coverColor }} />
  }

  // page
  return (
    <div className="w-full p-4 dark bg-black">
      <div style={{ height: PAGE_LABEL_HEIGHT * counterScale, overflow: 'visible' }}>
        <p
          className="text-xs text-muted-foreground text-center"
          style={{
            transform: `scale(${counterScale})`,
            transformOrigin: 'top center',
            display: 'block',
          }}
        >
          {t('pageLabel', { page: content.pageNumber })}
        </p>
      </div>
      <ReadOnlyGridSlots slots={content.page} gridType={gridType} onView={onView} />
    </div>
  )
}

// ─── 主元件 ───────────────────────────────────────────────────────────────────

export function BinderPublicView({ binder }: { binder: BinderPublicData }) {
  const t = useTranslations('binder')
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [mobilePageIndex, setMobilePageIndex] = useState(0)
  const [viewCard, setViewCard] = useState<CardWithCollectionStatus | null>(null)
  const addToBinder = useAddToBinder()

  // 公開頁加入的是訪客「自己的」卡冊（binderId 來自 AddToBinderSection 內 /api/binders），
  // 與正在瀏覽的他人公開卡冊無關，故不刷新顯示中的卡冊。
  const handleAddToBinder = async (binderId: string, status: CardStatus, quantity: number) => {
    if (!viewCard) return
    await addToBinder.mutateAsync({ card: viewCard, binderId, status, quantity })
  }

  const handleViewCard = async (cardId: string) => {
    const res = await fetch(`/api/cards/${cardId}`)
    if (!res.ok) {
      toast.error(t('loadCardFailed'))
      return
    }
    setViewCard(await res.json())
  }

  const gridType = binder.gridType as GridType
  const totalPages = binder.settings?.totalPages ?? 1
  const pages = buildGridPages(binder.slots, gridType, totalPages)
  const pagesArray = Array.from({ length: totalPages }, (_, i) => pages.get(i + 1) ?? [])
  const spreads = buildSpreads(pagesArray)
  const mobilePages = buildMobilePages(pagesArray)

  // Snowglobe hooks — 必須無條件呼叫
  const {
    outerRef: spreadOuterRef,
    innerRef: spreadInnerRef,
    scale: spreadScale,
    offsetX: spreadOffsetX,
  } = useScaleFit(SPREAD_NATURAL_WIDTH)

  const {
    outerRef: mobileOuterRef,
    innerRef: mobileInnerRef,
    scale: mobileScale,
    offsetX: mobileOffsetX,
  } = useScaleFit(MOBILE_PAGE_NATURAL_WIDTH)

  const spread = spreads[spreadIndex]
  const mobilePage = mobilePages[mobilePageIndex]

  const isLastSpread = spreadIndex === spreads.length - 1
  const isLastMobilePage = mobilePageIndex === mobilePages.length - 1

  // counterScale 抵銷 innerRef 縮放，使 header 與頁碼維持自然視覺尺寸
  const spreadCounterScale = spreadScale > 0 ? 1 / spreadScale : 1
  const mobileCounterScale = mobileScale > 0 ? 1 / mobileScale : 1

  // header 在 innerRef 自然座標中的寬度，視覺寬度 = naturalWidth × scale
  const spreadHeaderNaturalWidth =
    spreadScale > 0 ? SPREAD_NATURAL_WIDTH * spreadScale : SPREAD_NATURAL_WIDTH
  const mobileHeaderNaturalWidth =
    mobileScale > 0 ? MOBILE_PAGE_NATURAL_WIDTH * mobileScale : MOBILE_PAGE_NATURAL_WIDTH

  // 補償 counter-scale 視覺溢出
  const spreadDynamicSpacerH =
    spreadScale > 0 && spreadScale < 1 ? HEADER_HEIGHT * (1 / spreadScale - 1) : 0
  const mobileDynamicSpacerH =
    mobileScale > 0 && mobileScale < 1 ? HEADER_HEIGHT * (1 / mobileScale - 1) : 0

  const headerLeft = (
    <div>
      <p
        className="text-xs text-muted-foreground leading-none"
        data-testid="public-owner-banner"
      >
        {t('publicView.ownerBinder', { ownerName: binder.ownerName })}
      </p>
      <h1 className="text-xl font-bold leading-tight">{binder.name}</h1>
    </div>
  )

  const panelProps = {
    coverColor: binder.coverColor,
    gridType,
    binderName: binder.name,
    description: binder.description,
    onView: handleViewCard,
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-[calc(100vh-57px)] p-4">

      {/* ── 桌面 Spread 雙頁展開 ── */}
      <div
        data-testid="binder-public-spread-view"
        className="hidden md:flex flex-col flex-1 min-h-0"
      >
        <div ref={spreadOuterRef} className="flex-1 min-h-0 relative overflow-hidden">
          {spread && (
            <div
              ref={spreadInnerRef}
              style={{
                position: 'absolute',
                width: SPREAD_NATURAL_WIDTH,
                top: 0,
                left: spreadOffsetX,
                transform: `scale(${spreadScale})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Header — counter-scale 維持自然視覺尺寸 */}
              <div
                style={{
                  transform: `scale(${spreadCounterScale})`,
                  transformOrigin: 'top left',
                  width: spreadHeaderNaturalWidth,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: HEADER_HEIGHT,
                }}
              >
                {headerLeft}
                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <ButtonGroup>
                        <IconTooltipButton
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setSpreadIndex(0)}
                          disabled={spreadIndex === 0}
                          tooltip={t('firstPage')}
                        >
                          <ChevronsLeft />
                        </IconTooltipButton>
                        <IconTooltipButton
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setSpreadIndex(spreadIndex - 1)}
                          disabled={spreadIndex === 0}
                          tooltip={t('prevPage')}
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
                        <IconTooltipButton
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setSpreadIndex(spreadIndex + 1)}
                          disabled={isLastSpread}
                          tooltip={t('nextPage')}
                        >
                          <ChevronRight />
                        </IconTooltipButton>
                        <IconTooltipButton
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setSpreadIndex(spreads.length - 1)}
                          disabled={isLastSpread}
                          tooltip={t('lastPage')}
                        >
                          <ChevronsRight />
                        </IconTooltipButton>
                      </ButtonGroup>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>

              <div style={{ height: spreadDynamicSpacerH }} />

              <div className="flex gap-4">
                <div
                  className="flex-1 rounded-lg overflow-hidden"
                  style={{
                    border: `4px solid ${binder.coverColor}`,
                    backgroundColor: binder.coverColor,
                  }}
                >
                  <PublicPanelContent
                    content={spread.left}
                    counterScale={spreadCounterScale}
                    {...panelProps}
                  />
                </div>
                <div
                  className="flex-1 rounded-lg overflow-hidden"
                  style={{
                    border: `4px solid ${binder.coverColor}`,
                    backgroundColor: binder.coverColor,
                  }}
                >
                  <PublicPanelContent
                    content={spread.right}
                    counterScale={spreadCounterScale}
                    {...panelProps}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 行動裝置單頁 ── */}
      <div
        data-testid="binder-public-mobile-view"
        className="md:hidden flex flex-col flex-1 min-h-0"
      >
        <div ref={mobileOuterRef} className="flex-1 min-h-0 relative overflow-hidden">
          {mobilePage && (
            <div
              ref={mobileInnerRef}
              style={{
                position: 'absolute',
                width: MOBILE_PAGE_NATURAL_WIDTH,
                top: 0,
                left: mobileOffsetX,
                transform: `scale(${mobileScale})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Header — counter-scale 維持自然視覺尺寸 */}
              <div
                style={{
                  transform: `scale(${mobileCounterScale})`,
                  transformOrigin: 'top left',
                  width: mobileHeaderNaturalWidth,
                  display: 'flex',
                  alignItems: 'center',
                  height: HEADER_HEIGHT,
                }}
              >
                {headerLeft}
              </div>

              <div style={{ height: mobileDynamicSpacerH }} />

              <div
                className="rounded-lg overflow-hidden"
                style={{
                  border: `4px solid ${binder.coverColor}`,
                  backgroundColor: binder.coverColor,
                }}
              >
                <PublicPanelContent
                  content={mobilePage}
                  counterScale={mobileCounterScale}
                  mobileWrapper
                  {...panelProps}
                />
              </div>
            </div>
          )}

          {/* 側邊翻頁按鈕 — 在 outerRef 內，不受 scale 影響 */}
          {mobilePageIndex > 0 && (
            <Button
              variant="outline"
              size="icon"
              style={{
                position: 'absolute',
                left: mobileOffsetX - 44,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              className="z-20"
              onClick={() => setMobilePageIndex(mobilePageIndex - 1)}
              aria-label={t('prevPage')}
            >
              <ChevronLeft />
            </Button>
          )}
          {!isLastMobilePage && (
            <Button
              variant="outline"
              size="icon"
              style={{
                position: 'absolute',
                right: mobileOffsetX - 44,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              className="z-20"
              onClick={() => setMobilePageIndex(mobilePageIndex + 1)}
              aria-label={t('nextPage')}
            >
              <ChevronRight />
            </Button>
          )}
        </div>

        {/* Pagination — 固定於卡冊下方（shrink-0，不進 Snowglobe） */}
        <div className="shrink-0 flex items-center justify-center py-2">
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <ButtonGroup>
                  <IconTooltipButton
                    variant="outline"
                    size="icon"
                    onClick={() => setMobilePageIndex(0)}
                    disabled={mobilePageIndex === 0}
                    tooltip={t('firstPage')}
                  >
                    <ChevronsLeft />
                  </IconTooltipButton>
                  <IconTooltipButton
                    variant="outline"
                    size="icon"
                    onClick={() => setMobilePageIndex(mobilePageIndex - 1)}
                    disabled={mobilePageIndex === 0}
                    tooltip={t('prevPage')}
                  >
                    <ChevronLeft />
                  </IconTooltipButton>
                </ButtonGroup>
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm text-muted-foreground tabular-nums px-1">
                  {mobilePageIndex + 1} / {mobilePages.length}
                </span>
              </PaginationItem>
              <PaginationItem>
                <ButtonGroup>
                  <IconTooltipButton
                    variant="outline"
                    size="icon"
                    onClick={() => setMobilePageIndex(mobilePageIndex + 1)}
                    disabled={isLastMobilePage}
                    tooltip={t('nextPage')}
                  >
                    <ChevronRight />
                  </IconTooltipButton>
                  <IconTooltipButton
                    variant="outline"
                    size="icon"
                    onClick={() => setMobilePageIndex(mobilePages.length - 1)}
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

      <CardDetailDrawer
        card={viewCard}
        open={viewCard !== null}
        onClose={() => setViewCard(null)}
        onAddToBinder={handleAddToBinder}
      />
    </div>
  )
}
