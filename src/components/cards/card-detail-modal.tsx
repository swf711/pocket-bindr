'use client'
import { useState, useEffect } from 'react'
import { CardStatus } from '@prisma/client'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { CardWithCollectionStatus } from '@/types/card'
import { BinderSummary } from '@/types/binder'
import { LoginModal } from '@/components/auth/login-modal'

interface CardDetailModalProps {
  card: CardWithCollectionStatus | null
  open: boolean
  onClose: () => void
  onAddToBinder?: (binderId: string, status: CardStatus, quantity: number) => Promise<void>
  onCollectionUpdate?: (cardId: string, newStatus: { owned: number | null; wanted: number | null }) => void
}

export function CardDetailModal({ card, open, onClose, onAddToBinder, onCollectionUpdate }: CardDetailModalProps) {
  if (!card) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="md:w-8/12 max-w-full md:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{card.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 no-scrollbar max-h-[90vh] overflow-y-auto">
          {/* 左欄：卡圖 */}
          <div className="flex justify-center items-start">
            <img
              src={card.imageLarge || card.imageSmall || ''}
              alt={card.name}
              className="w-full rounded-lg"
            />
          </div>
          {/* 右欄：資訊 + 操作 */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {card.set.name} · {card.cardNumber}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {card.rarity && <Badge variant="outline">{card.rarity}</Badge>}
                {card.hp && <Badge variant="outline">HP {card.hp}</Badge>}
                {card.types.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">收藏狀態</p>
              <div className="flex gap-3">
                <span className="text-sm">
                  已擁有 <span className="font-medium" data-testid="modal-owned-count">{card.collectionStatus.owned ?? 0}</span> 張
                </span>
                <span className="text-sm">
                  想要 <span className="font-medium" data-testid="modal-wanted-count">{card.collectionStatus.wanted ?? 0}</span> 張
                </span>
              </div>
            </div>
            <Separator />
            <AddToBinderSection card={card} onAddToBinder={onAddToBinder} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddToBinderSection({
  card,
  onAddToBinder,
}: {
  card: CardWithCollectionStatus
  onAddToBinder?: CardDetailModalProps['onAddToBinder']
}) {
  const [binders, setBinders] = useState<BinderSummary[]>([])
  const [isGuest, setIsGuest] = useState(false)
  const [noBinders, setNoBinders] = useState(false)
  const [selectedBinderId, setSelectedBinderId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<CardStatus>('owned')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

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
          }}
        />
      </div>
    )
  }

  if (noBinders) {
    return (
      <p className="text-sm text-muted-foreground">
        尚無卡冊，<a href="/binders" className="underline">前往建立</a>
      </p>
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
          <SelectTrigger data-testid="modal-binder-select">
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
        <div className="flex gap-2">
          <Button
            data-testid="modal-status-owned"
            size="sm"
            variant={selectedStatus === 'owned' ? 'default' : 'secondary'}
            onClick={() => setSelectedStatus('owned')}
          >
            ✓ 擁有
          </Button>
          <Button
            data-testid="modal-status-wanted"
            size="sm"
            variant={selectedStatus === 'wanted' ? 'default' : 'secondary'}
            onClick={() => setSelectedStatus('wanted')}
          >
            ♡ 想要
          </Button>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">數量</p>
        <div className="flex items-center gap-2">
          <Button
            data-testid="modal-qty-minus"
            size="sm"
            variant="outline"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
          >
            -
          </Button>
          <span data-testid="modal-qty-value" className="w-6 text-center text-sm">
            {quantity}
          </span>
          <Button
            data-testid="modal-qty-plus"
            size="sm"
            variant="outline"
            onClick={() => setQuantity(q => Math.min(99, q + 1))}
          >
            +
          </Button>
        </div>
      </div>
      <Button
        data-testid="modal-add-btn"
        onClick={handleAdd}
        disabled={!onAddToBinder || loading || !selectedBinderId}
        title={!onAddToBinder ? '即將推出' : undefined}
      >
        {loading ? '加入中...' : '加入卡冊'}
      </Button>
    </div>
  )
}
