'use client'
import { useState, useEffect } from 'react'
import { CardStatus } from '@prisma/client'
import { toast } from 'sonner'
import {
  Drawer, DrawerHeader, DrawerTitle, DrawerPortal
} from '@/components/ui/drawer'
import { CardDetailDrawerContent } from '@/components/cards/card-detail-drawer-content'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, ChevronRight, BookCheck, Bookmark } from 'lucide-react'
import { CardWithCollectionStatus } from '@/types/card'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import { BinderSummary } from '@/types/binder'
import { LoginModal } from '@/components/auth/login-modal'
import { CreateBinderDialog } from '@/components/binders/create-binder-dialog'
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
}

export function CardDetailDrawer({ card, open, onClose, onAddToBinder, onLoginSuccess, cards, currentIndex, onNavigate, hideAddToBinder = false }: CardDetailDrawerProps) {
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

  const imageUrl =
    getCardImageUrl(!card.isCollectible && card.canonicalCard ? card.canonicalCard.imageLarge : card.imageLarge) ||
    getCardImageUrl(!card.isCollectible && card.canonicalCard ? card.canonicalCard.imageSmall : card.imageSmall) ||
    ''

  const atStart = currentIndex === undefined || currentIndex === 0
  const atEnd = currentIndex === undefined || !cards || currentIndex === cards.length - 1

  const PrevButton = onNavigate && (
    <Button
      data-testid="modal-nav-prev"
      variant="outline"
      size="icon-lg"
      className="rounded-full md:scale-130 md:hover:scale-140 active:scale-90 md:active:scale-130 transition-transform"
      disabled={atStart}
      onClick={() => onNavigate(currentIndex! - 1)}
    >
      <ChevronLeft />
    </Button>
  )

  const NextButton = onNavigate && (
    <Button
      data-testid="modal-nav-next"
      variant="outline"
      size="icon-lg"
      className="rounded-full md:scale-130 md:hover:scale-140 active:scale-90 md:active:scale-130 transition-transform"
      disabled={atEnd}
      onClick={() => onNavigate(currentIndex! + 1)}
    >
      <ChevronRight />
    </Button>
  )

  const infoBlock = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
        <span className="text-muted-foreground">系列</span>
        <span>
          {card.set.name}{' '}
          <span className="text-muted-foreground">{card.set.externalId}</span>
        </span>

        <span className="text-muted-foreground">卡號</span>
        <span>{card.cardNumber}</span>

        {card.set.releaseDate && (
          <>
            <span className="text-muted-foreground">發售日</span>
            <span>{card.set.releaseDate.slice(0, 10)}</span>
          </>
        )}

        {card.rarity && (
          <>
            <span className="text-muted-foreground">稀有度</span>
            <span><Badge variant="outline">{card.rarity}</Badge></span>
          </>
        )}

        {card.hp != null && (
          <>
            <span className="text-muted-foreground">HP</span>
            <span><Badge variant="outline">{card.hp}</Badge></span>
          </>
        )}

        {card.types.length > 0 && (
          <>
            <span className="text-muted-foreground">屬性</span>
            <span className="flex flex-wrap gap-1">
              {card.types.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
            </span>
          </>
        )}
      </div>
    </div>
  )

  // 收藏狀態：DrawerHeader 內僅以 icon + 數字呈現
  const statusSummary = (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span className="flex items-center gap-1">
        <BookCheck className="size-4" />
        <span className="font-medium text-foreground" data-testid="modal-owned-count">{card.collectionStatus.owned ?? 0}</span>
      </span>
      <span className="flex items-center gap-1">
        <Bookmark className="size-4" />
        <span className="font-medium text-foreground" data-testid="modal-wanted-count">{card.collectionStatus.wanted ?? 0}</span>
      </span>
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
        className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-xs data-[vaul-drawer-direction=right]:justify-center"
      >
        <DrawerHeader>
          {isMobile ? (
            <div className="flex items-center justify-between gap-2">
              {PrevButton}
              <DrawerTitle className="text-2xl min-w-0 flex-1 truncate text-center">{card.name}</DrawerTitle>
              {NextButton}
            </div>
          ) : (
            <DrawerTitle className="text-2xl truncate" title={card.name}>
              {card.name}
            </DrawerTitle>
          )}
        </DrawerHeader>
        {isMobile ? (
          <div
            className={cn(
              'no-scrollbar overflow-y-auto px-4 pb-6',
              hideAddToBinder ? 'flex flex-col gap-4' : 'grid grid-cols-2 items-start gap-4',
            )}
          >
            {/* 左欄：卡牌資訊；右欄：加入卡冊操作（收藏狀態移至卡圖下方 overlay） */}
            {infoBlock}
            {!hideAddToBinder && (
              <AddToBinderSection card={card} onAddToBinder={onAddToBinder} onLoginSuccess={onLoginSuccess} />
            )}
          </div>
        ) : (
          <div className="no-scrollbar flex flex-col gap-4 overflow-y-auto px-4 pb-6">
            {infoBlock}
            {!hideAddToBinder && (
              <>
                <Separator />
                <AddToBinderSection card={card} onAddToBinder={onAddToBinder} onLoginSuccess={onLoginSuccess} />
              </>
            )}
          </div>
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
                      ? 'flex min-h-0 max-w-[92vw] flex-1 items-center justify-center'
                      : 'max-h-[85vh] w-auto max-w-[min(30rem,48vw)]'
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
                      <img
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

function AddToBinderSection({
  card,
  onAddToBinder,
  onLoginSuccess,
}: {
  card: CardWithCollectionStatus
  onAddToBinder?: CardDetailDrawerProps['onAddToBinder']
  onLoginSuccess?: CardDetailDrawerProps['onLoginSuccess']
}) {
  const [binders, setBinders] = useState<BinderSummary[]>([])
  const [isGuest, setIsGuest] = useState(false)
  const [noBinders, setNoBinders] = useState(false)
  const [selectedBinderId, setSelectedBinderId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<CardStatus>('owned')
  const [quantity, setQuantity] = useState(1)
  const [qtyDraft, setQtyDraft] = useState<string | null>(null) // 編輯中暫存（null = 未編輯，顯示 quantity）
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    fetch('/api/binders')
      .then(async res => {
        if (res.status === 401) { setIsGuest(true); return }
        if (res.ok) {
          const data = await res.json()
          const list: BinderSummary[] = Array.isArray(data) ? data : (data.binders ?? [])
          setBinders(list)
          if (list.length === 0) setNoBinders(true)
          else setSelectedBinderId(list[0].id)
        }
      })
      .catch(() => {})
  }, [card.id])

  const [loginModalOpen, setLoginModalOpen] = useState(false)

  if (isGuest) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">請先登入以加入卡冊</p>
        <Button
          data-testid="modal-add-btn"
          onClick={() => setLoginModalOpen(true)}
        >
          加入卡冊
        </Button>
        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={() => {
            setLoginModalOpen(false)
            setIsGuest(false)
            fetch('/api/binders').then(async res => {
              if (res.ok) {
                const data = await res.json()
                const list: BinderSummary[] = Array.isArray(data) ? data : (data.binders ?? [])
                setBinders(list)
                if (list.length === 0) setNoBinders(true)
                else setSelectedBinderId(list[0].id)
              }
            })
            console.log('[DEBUG] calling onLoginSuccess', typeof onLoginSuccess)
            onLoginSuccess?.()
          }}
        />
      </div>
    )
  }

  if (noBinders) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">尚無卡冊</p>
        <Button onClick={() => setCreateOpen(true)}>建立卡冊</Button>
        <CreateBinderDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(binder: BinderSummary) => {
            setBinders(prev => [binder, ...prev])
            setSelectedBinderId(binder.id)
            setNoBinders(false)
          }}
        />
      </div>
    )
  }

  const handleAdd = async () => {
    if (!onAddToBinder || !selectedBinderId) return
    setLoading(true)
    try {
      await onAddToBinder(selectedBinderId, selectedStatus, quantity)
      setQuantity(1)
      toast.success(`已加入 ${quantity} 張到卡冊`)
    } catch {
      toast.error('加入失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs text-muted-foreground mb-1">卡冊</p>
        <Select value={selectedBinderId} onValueChange={setSelectedBinderId}>
          <SelectTrigger data-testid="modal-binder-select" className="w-full">
            <SelectValue placeholder="選擇卡冊" />
          </SelectTrigger>
          <SelectContent>
            {binders.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">狀態</p>
        <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as CardStatus)}>
          <TabsList className="w-full">
            <TabsTrigger data-testid="modal-status-owned" value="owned" className="flex-1">
              <BookCheck /> 擁有
            </TabsTrigger>
            <TabsTrigger data-testid="modal-status-wanted" value="wanted" className="flex-1">
              <Bookmark /> 想要
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">數量</p>
        <ButtonGroup className="w-full">
          <Button
            data-testid="modal-qty-minus"
            size="icon"
            variant="outline"
            onClick={() => { setQtyDraft(null); setQuantity(q => Math.max(1, q - 1)) }}
          >
            -
          </Button>
          <Input
            data-testid="modal-qty-value"
            type="number"
            min={1}
            max={99}
            value={qtyDraft ?? String(quantity)}
            onFocus={() => setQtyDraft('')} // 點擊輸入時清空，方便直接輸入
            onChange={(e) => setQtyDraft(e.target.value)}
            onBlur={() => {
              const n = parseInt(qtyDraft ?? '', 10)
              setQuantity(Number.isNaN(n) ? 1 : Math.min(99, Math.max(1, n))) // 無效或非數字 → 1
              setQtyDraft(null)
            }}
            className="w-14 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <Button
            data-testid="modal-qty-plus"
            size="icon"
            variant="outline"
            onClick={() => { setQtyDraft(null); setQuantity(q => Math.min(99, q + 1)) }}
          >
            +
          </Button>
        </ButtonGroup>
      </div>
      <Button
        data-testid="modal-add-btn"
        className="mt-2"
        onClick={handleAdd}
        disabled={!onAddToBinder || loading || !selectedBinderId}
        title={!onAddToBinder ? '即將推出' : undefined}
      >
        {loading ? '加入中...' : '加入卡冊'}
      </Button>
    </div>
  )
}
