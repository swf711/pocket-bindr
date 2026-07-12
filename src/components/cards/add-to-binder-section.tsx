'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { CardStatus } from '@prisma/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PILL_TABS_LIST, PILL_TABS_TRIGGER } from '@/lib/tabs-styles'
import { BookCheck, Bookmark, Minus, Plus } from 'lucide-react'
import { CardWithCollectionStatus } from '@/types/card'
import { getLastAddedBinderId, setLastAddedBinderId } from '@/lib/last-binder-store'
import { BinderSummary } from '@/types/binder'
import { LoginModal } from '@/components/auth/login-modal'
import { CreateBinderDialog } from '@/components/binders/create-binder-dialog'
import { cn } from '@/lib/utils'

/**
 * 加入卡冊區塊——從 card-detail-drawer.tsx 抽出為獨立檔（零 props/行為變更），
 * 讓卡片獨立 SEO 頁（card-standalone-view.tsx）也能重用同一套登入引導 + 加入卡冊流程。
 */
export function AddToBinderSection({
  card,
  onAddToBinder,
  onLoginSuccess,
  currentBinderId,
}: {
  card: CardWithCollectionStatus
  onAddToBinder?: (binderId: string, status: CardStatus, quantity: number) => Promise<void>
  onLoginSuccess?: () => void
  currentBinderId?: string
}) {
  const t = useTranslations('cardDetail')
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
          else {
            const remembered = getLastAddedBinderId()
            setSelectedBinderId(
              list.find(b => b.id === currentBinderId)?.id ??
              list.find(b => b.id === remembered)?.id ??
              list[0].id
            )
          }
        }
      })
      .catch(() => { })
  }, [card.id, currentBinderId])

  const [loginModalOpen, setLoginModalOpen] = useState(false)

  if (isGuest) {
    return (
      <div className="flex flex-col gap-3" onPointerDown={(e) => e.stopPropagation()}>
        <p className="text-sm text-muted-foreground">{t('loginRequired')}</p>
        <Button
          size="lg"
          data-testid="modal-add-btn"
          onClick={() => setLoginModalOpen(true)}
        >
          {t('addToBinder')}
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
                else {
                  const remembered = getLastAddedBinderId()
                  setSelectedBinderId(
                    list.find(b => b.id === currentBinderId)?.id ??
                    list.find(b => b.id === remembered)?.id ??
                    list[0].id
                  )
                }
              }
            })
            onLoginSuccess?.()
          }}
        />
      </div>
    )
  }

  if (noBinders) {
    return (
      // vaul Drawer 內容可拖曳，pointerdown 會被 vaul 當拖曳手勢攔截而吞掉按鈕 click
      // （負載下偶發，致「建立卡冊」未開啟巢狀 CreateBinderDialog）。stopPropagation
      // 阻止 vaul 接到此互動區的 pointerdown，與卡圖 overlay（見上方）同一 pattern。
      <div className="flex flex-col gap-3" onPointerDown={(e) => e.stopPropagation()}>
        <p className="text-sm text-muted-foreground">{t('noBinders')}</p>
        <Button size="lg" onClick={() => setCreateOpen(true)}>{t('createBinder')}</Button>
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
      setLastAddedBinderId(selectedBinderId)
      setQuantity(1)
      toast.success(t('addedSuccess', { quantity }))
    } catch {
      toast.error(t('addFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3" onPointerDown={(e) => e.stopPropagation()}>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{t('binder')}</p>
        <Select value={selectedBinderId} onValueChange={setSelectedBinderId}>
          <SelectTrigger data-testid="modal-binder-select" className="w-full data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/50 dark:hover:bg-input/30">
            <SelectValue placeholder={t('selectBinder')} />
          </SelectTrigger>
          <SelectContent position="popper">
            {binders.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{t('status')}</p>
        <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as CardStatus)}>
          <TabsList className={cn(PILL_TABS_LIST, 'w-full')}>
            <TabsTrigger data-testid="modal-status-owned" value="owned" className={PILL_TABS_TRIGGER}>
              <BookCheck /> {t('owned')}
            </TabsTrigger>
            <TabsTrigger data-testid="modal-status-wanted" value="wanted" className={PILL_TABS_TRIGGER}>
              <Bookmark /> {t('wanted')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{t('quantity')}</p>
        <ButtonGroup className="w-full">
          <Button
            data-testid="modal-qty-minus"
            size="icon"
            variant="outline"
            className="rounded-r-none! rounded-l-(--m3-radius-md)! border-input"
            onClick={() => { setQtyDraft(null); setQuantity(q => Math.max(1, q - 1)) }}
          >
            <Minus />
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
            className="rounded-none! w-14 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <Button
            data-testid="modal-qty-plus"
            size="icon"
            variant="outline"
            className="rounded-l-none! rounded-r-(--m3-radius-md)! border-input"
            onClick={() => { setQtyDraft(null); setQuantity(q => Math.min(99, q + 1)) }}
          >
            <Plus />
          </Button>
        </ButtonGroup>
      </div>
      <Button
        data-testid="modal-add-btn"
        className="mt-2 h-10"
        onClick={handleAdd}
        disabled={!onAddToBinder || loading || !selectedBinderId}
        title={!onAddToBinder ? t('comingSoon') : undefined}
      >
        {loading ? t('adding') : t('addToBinder')}
      </Button>
    </div>
  )
}
