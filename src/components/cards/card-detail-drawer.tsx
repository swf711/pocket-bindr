'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { CardStatus } from '@prisma/client'
import { toast } from 'sonner'
import { ReportDialog } from '@/components/report/report-dialog'
import {
  Drawer, DrawerHeader, DrawerTitle, DrawerPortal,
  DrawerClose
} from '@/components/ui/drawer'
import { CardDetailDrawerContent } from '@/components/cards/card-detail-drawer-content'
import { IconTooltipButton } from '@/components/common/icon-tooltip-button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight, BookCheck, Bookmark, X, Flag, Share2 } from 'lucide-react'
import { CardWithCollectionStatus } from '@/types/card'
import { resolveCardDisplayImage } from '@/lib/resolve-card-image'
import { buildCardShareUrl, shareOrCopy } from '@/lib/share-card'
import { AddToBinderSection } from '@/components/cards/add-to-binder-section'
import { CardImage } from '@/components/cards/card-image'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { useCardTilt } from '@/hooks/use-card-tilt'
import { cn } from '@/lib/utils'

interface CardDetailDrawerProps {
  card: CardWithCollectionStatus | null
  open: boolean
  onClose: () => void
  onAddToBinder?: (binderId: string, status: CardStatus, quantity: number) => Promise<void>
  onLoginSuccess?: () => void
  cards?: CardWithCollectionStatus[]
  currentIndex?: number
  onNavigate?: (index: number) => void
  hideAddToBinder?: boolean
  currentBinderId?: string
  onSeriesClick?: () => void
}

export function CardDetailDrawer({ card, open, onClose, onAddToBinder, onLoginSuccess, cards, currentIndex, onNavigate, hideAddToBinder = false, currentBinderId, onSeriesClick }: CardDetailDrawerProps) {
  const t = useTranslations('cardDetail')
  const tReport = useTranslations('report')
  const { data: session } = useSession()
  const [reportOpen, setReportOpen] = useState(false)
  const isMobile = useIsMobile()
  const { containerRef: tiltRef, transformerStyle, shineStyle, handlers: tiltHandlers } = useCardTilt({
    maxRotateDeg: 15,
  })

  // 行動底部 drawer：量測實際高度，把上方剩餘空間全留給 overlay 卡圖（不寫死 vh）
  // overlayBottom 初始為 0 會讓容器佔滿全螢幕 → 卡圖全螢幕；故以 rAF 量到「穩定值」後才顯示（overlayReady）
  const [overlayBottom, setOverlayBottom] = useState(0)
  const [overlayReady, setOverlayReady] = useState(false)
  useEffect(() => {
    if (!open || !isMobile) { setOverlayReady(false); return }
    // 於迴圈內查詢元素，避免 mount 當下 portal 尚未進 DOM 導致量不到
    const measureValue = () => {
      const el = document.querySelector('[data-testid="card-detail-drawer"]') as HTMLElement | null
      return el ? Math.max(0, window.innerHeight - el.getBoundingClientRect().top) : 0
    }
    let raf = 0
    let last = -1
    let stable = 0
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      const v = measureValue()
      setOverlayBottom(v)
      if (v > 0 && Math.abs(v - last) < 1) {
        if (++stable >= 2) { setOverlayReady(true); return } // 連續兩幀一致 → 開啟動畫已結束
      } else {
        stable = 0
      }
      last = v
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // 開啟後內容高度變動（換卡）或視窗縮放時持續更新
    const update = () => setOverlayBottom(measureValue())
    window.addEventListener('resize', update)
    const el = document.querySelector('[data-testid="card-detail-drawer"]') as HTMLElement | null
    const ro = el ? new ResizeObserver(update) : null
    ro?.observe(el!)
    const t = setTimeout(() => setOverlayReady(true), 700) // 保險：動畫異常時仍顯示
    return () => { cancelled = true; cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('resize', update); clearTimeout(t) }
  }, [open, isMobile])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      // 焦點在輸入元件時，左右鍵交給游標移動，不觸發上一張/下一張
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'ArrowLeft') {
        if (onNavigate && currentIndex !== undefined && currentIndex > 0) {
          onNavigate(currentIndex - 1)
        }
      } else if (e.key === 'ArrowRight') {
        if (onNavigate && currentIndex !== undefined && cards && currentIndex < cards.length - 1) {
          onNavigate(currentIndex + 1)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, currentIndex, cards, onNavigate])

  if (!card) return null

  const handleShare = async () => {
    // 網址必須由 card 自身組出，不可取 window.location.href——本 Drawer 也被
    // /binders/[id]、/collection、/b/[token] 重用，那些頁面的網址是卡冊的。
    const url = buildCardShareUrl(card, window.location.origin)
    try {
      const outcome = await shareOrCopy(url, card.name)
      // 'shared' / 'dismissed' 皆不提示：系統分享單本身已是回饋。
      if (outcome === 'copied') toast.success(t('linkCopied'))
    } catch {
      toast.error(t('shareFailed'))
    }
  }

  const imageUrl = resolveCardDisplayImage(card).large

  const atStart = currentIndex === undefined || currentIndex === 0
  const atEnd = currentIndex === undefined || !cards || currentIndex === cards.length - 1

  const PrevButton = onNavigate && (
    <IconTooltipButton
      data-testid="modal-nav-prev"
      variant="outline"
      size="icon-lg"
      className="rounded-full bg-background/80 md:scale-130 md:hover:scale-140 active:scale-90 md:active:scale-130 transition-transform"
      disabled={atStart}
      onClick={() => onNavigate(currentIndex! - 1)}
      tooltip={t('prev')}
    >
      <ChevronLeft />
    </IconTooltipButton>
  )

  const NextButton = onNavigate && (
    <IconTooltipButton
      data-testid="modal-nav-next"
      variant="outline"
      size="icon-lg"
      className="rounded-full bg-background/80 md:scale-130 md:hover:scale-140 active:scale-90 md:active:scale-130 transition-transform"
      disabled={atEnd}
      onClick={() => onNavigate(currentIndex! + 1)}
      tooltip={t('next')}
    >
      <ChevronRight />
    </IconTooltipButton>
  )

  const infoBlock = (
    // select-text 覆寫 vaul 對 [data-vaul-drawer] 下的 user-select:none（僅 pointer:fine 命中）；
    // data-vaul-no-drag 讓 vaul 的 shouldDrag 跳過此子樹，拖選文字才不會變成拖曳關閉 Drawer。
    // ⚠️ 兩者只能加在子元素——vaul 的 CSS 是 unlayered，加在 content 根元素會贏過 @layer utilities。
    <div
      data-vaul-no-drag
      className="flex flex-col gap-3 text-sm select-text md:grid md:grid-cols-[auto_1fr] md:items-center md:gap-x-4 md:gap-y-3"
    >
      <div className="flex flex-col gap-0.5 md:contents">
        <span className="text-xs text-muted-foreground">{t('series')}</span>
        {onSeriesClick ? (
          <button
            type="button"
            data-testid="drawer-series-filter"
            data-vaul-no-drag
            onClick={onSeriesClick}
            aria-label={t('filterBySeries')}
            className="w-fit text-left text-primary underline-offset-4 hover:underline"
          >
            {card.set.name}{' '}
            <span className="text-xs text-muted-foreground">{card.set.externalId}</span>
          </button>
        ) : (
          <span>
            {card.set.name}{' '}
            <span className="text-xs text-muted-foreground">{card.set.externalId}</span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5 md:contents">
        <span className="text-xs text-muted-foreground">{t('cardNumber')}</span>
        <span>{card.cardNumber}</span>
      </div>

      {card.set.releaseDate && (
        <div className="flex flex-col gap-0.5 md:contents">
          <span className="text-xs text-muted-foreground">{t('releaseDate')}</span>
          <span>{card.set.releaseDate.slice(0, 10)}</span>
        </div>
      )}

      {card.rarity && (
        <div className="flex flex-col gap-0.5 md:contents">
          <span className="text-xs text-muted-foreground">{t('rarity')}</span>
          <span><Badge className="bg-tertiary-container text-on-tertiary-container">{card.rarity}</Badge></span>
        </div>
      )}

      {card.hp != null && (
        <div className="flex flex-col gap-0.5 md:contents">
          <span className="text-xs text-muted-foreground">HP</span>
          <span><Badge className="bg-tertiary-container text-on-tertiary-container"> {card.hp} </Badge></span>
        </div>
      )}

      {card.types.length > 0 && (
        <div className="flex flex-col gap-0.5 md:contents">
          <span className="text-xs text-muted-foreground">{t('types')}</span>
          <span className="flex flex-wrap gap-1">
            {card.types.map(t => <Badge key={t} className="bg-tertiary-container text-on-tertiary-container">{t}</Badge>)}
          </span>
        </div>
      )}
    </div>
  )

  // 收藏狀態：DrawerHeader 內僅以 icon + 數字呈現
  const statusSummary = (
    <div className="flex items-center gap-3 text-sm">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1" aria-label={t('owned')}>
            <BookCheck className="size-4" />
            <span className="font-medium text-foreground" data-testid="modal-owned-count">{card.collectionStatus.owned ?? 0}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent><p>{t('owned')}</p></TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1" aria-label={t('wanted')}>
            <Bookmark className="size-4" />
            <span className="font-medium text-foreground" data-testid="modal-wanted-count">{card.collectionStatus.wanted ?? 0}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent><p>{t('wanted')}</p></TooltipContent>
      </Tooltip>
    </div>
  )

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => { if (!o) onClose() }}
      direction={isMobile ? 'bottom' : 'right'}
    >
      <CardDetailDrawerContent
        data-testid="card-detail-drawer"
        className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-xs"
      >
        <DrawerHeader>
          {isMobile ? (
            <div className="flex items-center justify-between gap-2">
              {PrevButton}
              <DrawerTitle
                data-vaul-no-drag
                className="text-2xl min-w-0 flex-1 truncate text-center select-text"
              >
                {card.name}
              </DrawerTitle>
              <IconTooltipButton
                data-testid="drawer-share-trigger"
                tooltip={t('share')}
                variant="ghost"
                size="icon-xs"
                onClick={handleShare}
              >
                <Share2 className="size-4" />
              </IconTooltipButton>
              {session?.user && (
                <IconTooltipButton
                  data-testid="drawer-report-trigger"
                  tooltip={tReport('trigger')}
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setReportOpen(true)}
                >
                  <Flag className="size-4" />
                </IconTooltipButton>
              )}
              {NextButton}
            </div>
          ) : (
            <div className='flex justify-between items-center pr-2'>
              <DrawerTitle
                data-vaul-no-drag
                className="text-2xl truncate select-text"
                title={card.name}
              >
                {card.name}
              </DrawerTitle>
              <div className="flex items-center gap-1">
                <IconTooltipButton
                  data-testid="drawer-share-trigger"
                  tooltip={t('share')}
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleShare}
                >
                  <Share2 className="size-4" />
                </IconTooltipButton>
                {session?.user && (
                  <IconTooltipButton
                    tooltip={tReport('trigger')}
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setReportOpen(true)}
                  >
                    <Flag className="size-4" />
                  </IconTooltipButton>
                )}
                <DrawerClose>
                  <X className="size-5" />
                </DrawerClose>
              </div>
            </div>
          )}
        </DrawerHeader>
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          defaultType="missing_card"
          defaultCardContext={{
            cardId: card.id,
            cardName: card.name,
            setExternalId: card.set.externalId,
            cardNumber: card.cardNumber,
          }}
        />
        {isMobile ? (
          <ScrollArea className="flex-1 min-h-0">
            <div
              className={cn(
                'px-4 pb-6',
                hideAddToBinder ? 'flex flex-col gap-4' : 'grid grid-cols-2 items-start gap-4',
              )}
            >
              {/* 左欄：卡牌資訊；右欄：加入卡冊操作（收藏狀態移至卡圖下方 overlay） */}
              {infoBlock}
              {!hideAddToBinder && (
                <AddToBinderSection card={card} onAddToBinder={onAddToBinder} onLoginSuccess={onLoginSuccess} currentBinderId={currentBinderId} />
              )}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="flex flex-col gap-4 px-4 pb-6">
              {infoBlock}
              {!hideAddToBinder && (
                <>
                  <Separator />
                  <AddToBinderSection card={card} onAddToBinder={onAddToBinder} onLoginSuccess={onLoginSuccess} currentBinderId={currentBinderId} />
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </CardDetailDrawerContent>

      {open && (!isMobile || overlayReady) && (
        <DrawerPortal>
          <div
            style={isMobile ? { bottom: overlayBottom, pointerEvents: 'none' } : undefined}
            className={cn(
              'z-50',
              isMobile
                ? 'fixed inset-x-0 top-0 flex items-center justify-center gap-2 p-4'
                : 'fixed inset-y-0 left-0 right-80 flex items-center justify-center gap-4 p-6'
            )}
          >
            <div
              style={{ pointerEvents: 'auto' }}
              className={cn('flex items-center gap-2 sm:gap-4', isMobile && 'h-full')}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {!isMobile && PrevButton}
              {/* 卡圖 + 收藏狀態（卡圖下方）成一垂直欄 */}
              <div className={cn('flex flex-col items-center gap-3', isMobile && 'h-full')}>
                <div
                  className={cn(
                    isMobile
                      ? 'flex min-h-0 max-w-[92vw] flex-1 h-full items-center justify-center'
                      : 'max-h-[85vh] w-[min(30rem,48vw)] max-w-[min(30rem,48vw)]'
                  )}
                >
                  <div
                    ref={tiltRef}
                    data-tilt-container
                    style={{ position: 'relative', borderRadius: 'var(--radius-lg)' }}
                    className={cn(isMobile && 'h-full')}
                    {...tiltHandlers}
                  >
                    <div style={transformerStyle} className={cn(isMobile && 'h-full')}>
                      <CardImage
                        data-testid="card-detail-image"
                        src={imageUrl}
                        alt={card.name}
                        className={cn('rounded-lg block', isMobile ? 'h-full w-auto max-w-full object-contain' : 'w-full')}
                      />
                      <div style={shineStyle} />
                    </div>
                  </div>
                </div>
                <div className="rounded-md bg-background/80 px-3 py-1 shadow-sm backdrop-blur-sm">
                  {statusSummary}
                </div>
              </div>
              {!isMobile && NextButton}
            </div>
          </div>
        </DrawerPortal>
      )}
    </Drawer>
  )
}
