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
import { getLastAddedBinderId, setLastAddedBinderId } from '@/lib/last-binder-store'
import { BinderSummary } from '@/types/binder'
import { LoginModal } from '@/components/auth/login-modal'
import { CreateBinderDialog } from '@/components/binders/create-binder-dialog'
import { useBatchAddToBinder } from '@/hooks/use-batch-add-to-binder'
import { ClientError } from '@/lib/client-error'
import { cn } from '@/lib/utils'

/**
 * 批次加入卡冊的控制項（卡冊 Select + 狀態 Tabs + 數量 stepper + 送出）＋ guest/noBinders 三態。
 * 桌面 inline（BatchAddBar 內）與手機底部 Drawer 共用同一份，避免重複。
 * 刻意不重構 AddToBinderSection 共用（該檔有 4 個消費點，blast radius 大），
 * binder picker / guest / noBinders 邏輯與其小重複，見 docs/TECH_DEBT.md。
 */
export function BatchAddControls({
  selectedIds,
  onSuccess,
  layout = 'row',
}: {
  selectedIds: string[]
  onSuccess: () => void
  /** row：桌面 inline 水平排列；stack：手機 Drawer 內垂直排列、按鈕加大 */
  layout?: 'row' | 'stack'
}) {
  const t = useTranslations('cardDetail')
  const tBatch = useTranslations('cards.batch')
  const [binders, setBinders] = useState<BinderSummary[]>([])
  const [isGuest, setIsGuest] = useState(false)
  const [noBinders, setNoBinders] = useState(false)
  const [selectedBinderId, setSelectedBinderId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<CardStatus>('owned')
  const [quantity, setQuantity] = useState(1)
  const [qtyDraft, setQtyDraft] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  const batchAdd = useBatchAddToBinder()
  const isStack = layout === 'stack'

  const loadBinders = () => {
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
            setSelectedBinderId(list.find(b => b.id === remembered)?.id ?? list[0].id)
          }
        }
      })
      .catch(() => { })
  }

  useEffect(() => {
    loadBinders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async () => {
    if (!selectedBinderId) return
    try {
      await batchAdd.mutateAsync({
        cardIds: selectedIds,
        binderId: selectedBinderId,
        status: selectedStatus,
        quantity,
      })
      setLastAddedBinderId(selectedBinderId)
      toast.success(tBatch('addedSuccess', { count: selectedIds.length }))
      onSuccess()
    } catch (err) {
      const code = err instanceof ClientError ? err.code : 'BATCH_ADD_FAILED'
      if (code === 'BATCH_CAPACITY_EXCEEDED') toast.error(tBatch('capacityExceeded'))
      else if (code === 'BATCH_RATE_LIMITED') toast.error(tBatch('rateLimited'))
      else toast.error(tBatch('addFailed'))
    }
  }

  if (isGuest) {
    return (
      <div className={cn('flex items-center gap-3', isStack && 'flex-col items-stretch')}>
        <p className="text-sm text-muted-foreground">{t('loginRequired')}</p>
        <Button
          data-testid="batch-submit-btn"
          size={isStack ? 'lg' : 'default'}
          onClick={() => setLoginModalOpen(true)}
        >
          {tBatch('submit')}
        </Button>
        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={() => {
            setLoginModalOpen(false)
            setIsGuest(false)
            loadBinders()
          }}
        />
      </div>
    )
  }

  if (noBinders) {
    return (
      <div className={cn('flex items-center gap-3', isStack && 'flex-col items-stretch')}>
        <p className="text-sm text-muted-foreground">{t('noBinders')}</p>
        <Button size={isStack ? 'lg' : 'default'} onClick={() => setCreateOpen(true)}>
          {t('createBinder')}
        </Button>
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

  return (
    <div className={cn('flex items-center gap-3', isStack && 'flex-col items-stretch gap-4')}>
      <Select value={selectedBinderId} onValueChange={setSelectedBinderId}>
        <SelectTrigger
          data-testid="batch-binder-select"
          className={cn(isStack ? 'w-full h-11' : 'w-full sm:w-48')}
        >
          <SelectValue placeholder={t('selectBinder')} />
        </SelectTrigger>
        <SelectContent position="popper">
          {binders.map(b => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Tabs
        value={selectedStatus}
        onValueChange={(v) => setSelectedStatus(v as CardStatus)}
        className={cn(isStack && 'w-full')}
      >
        <TabsList className={cn(PILL_TABS_LIST, isStack && 'w-full h-11')}>
          <TabsTrigger data-testid="batch-status-owned" value="owned" className={PILL_TABS_TRIGGER}>
            <BookCheck /> {t('owned')}
          </TabsTrigger>
          <TabsTrigger data-testid="batch-status-wanted" value="wanted" className={PILL_TABS_TRIGGER}>
            <Bookmark /> {t('wanted')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ButtonGroup className={cn(isStack && 'w-full')}>
        <Button
          data-testid="batch-qty-minus"
          size="icon"
          variant="outline"
          className={cn('rounded-r-none! rounded-l-(--m3-radius-md)! border-input', isStack && 'size-11')}
          onClick={() => { setQtyDraft(null); setQuantity(q => Math.max(1, q - 1)) }}
        >
          <Minus />
        </Button>
        <Input
          data-testid="batch-qty-value"
          type="number"
          min={1}
          max={99}
          value={qtyDraft ?? String(quantity)}
          onFocus={() => setQtyDraft('')}
          onChange={(e) => setQtyDraft(e.target.value)}
          onBlur={() => {
            const n = parseInt(qtyDraft ?? '', 10)
            setQuantity(Number.isNaN(n) ? 1 : Math.min(99, Math.max(1, n)))
            setQtyDraft(null)
          }}
          className={cn(
            'rounded-none! text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            isStack ? 'h-11 flex-1' : 'w-14',
          )}
        />
        <Button
          data-testid="batch-qty-plus"
          size="icon"
          variant="outline"
          className={cn('rounded-l-none! rounded-r-(--m3-radius-md)! border-input', isStack && 'size-11')}
          onClick={() => { setQtyDraft(null); setQuantity(q => Math.min(99, q + 1)) }}
        >
          <Plus />
        </Button>
      </ButtonGroup>

      <Button
        data-testid="batch-submit-btn"
        size={isStack ? 'lg' : 'default'}
        className={cn(isStack && 'w-full')}
        onClick={handleSubmit}
        disabled={batchAdd.isPending || !selectedBinderId}
      >
        {batchAdd.isPending ? t('adding') : tBatch('submit')}
      </Button>
    </div>
  )
}
