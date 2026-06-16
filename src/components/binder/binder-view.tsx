'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { GridType, CardStatus } from '@prisma/client'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { BinderSpreadView } from './binder-spread-view'
import { BinderMobileView } from './binder-mobile-view'
import { BinderSettingsDrawer } from './binder-settings-drawer'
import { SlotCardPickerDialog } from './slot-card-picker-dialog'
import { CardDetailDrawer } from '@/components/cards/card-detail-drawer'
import type { BinderDetailResponse, SlotWithCard, SlotCardResult } from '@/types/binder'
import type { CardWithCollectionStatus } from '@/types/card'
import { buildGridPages, buildSpreads, buildMobilePages, pageNumberToSpreadIndex } from '@/lib/binder-utils'
import { useIsMobile } from '@/hooks/use-is-mobile'

export function BinderView({ binder }: { binder: BinderDetailResponse }) {
  const [slots, setSlots] = useState<SlotWithCard[]>(binder.slots)
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [mobilePageIndex, setMobilePageIndex] = useState(0)
  const [totalPages, setTotalPages] = useState(binder.settings?.totalPages ?? 1)
  const [binderName, setBinderName] = useState(binder.name)
  const [binderGridType, setBInderGridType] = useState<GridType>(binder.gridType as GridType)
  const [binderCoverColor, setBinderCoverColor] = useState(binder.coverColor)
  const [pickerTarget, setPickerTarget] = useState<{ pageNumber: number; slotIndex: number } | null>(null)
  const [viewCard, setViewCard] = useState<CardWithCollectionStatus | null>(null)
  const [highlightedSlotId, setHighlightedSlotId] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = useIsMobile()

  const gridType = binderGridType
  const pages = buildGridPages(slots, gridType, totalPages)
  const pagesArray = Array.from({ length: totalPages }, (_, i) => pages.get(i + 1) ?? [])
  const spreads = buildSpreads(pagesArray)
  const mobilePages = buildMobilePages(pagesArray)

  const handleDelete = async (slotId: string) => {
    await fetch(`/api/binders/${binder.id}/slots/${slotId}`, { method: 'DELETE' })
    setSlots((prev) => prev.filter((s) => s.id !== slotId))
  }

  const handleSwap = async (slotAId: string, slotBId: string) => {
    const slotA = slots.find((s) => s.id === slotAId)
    const slotB = slots.find((s) => s.id === slotBId)
    if (!slotA || !slotB) return
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotAId) return { ...s, pageNumber: slotB.pageNumber, slotIndex: slotB.slotIndex }
        if (s.id === slotBId) return { ...s, pageNumber: slotA.pageNumber, slotIndex: slotA.slotIndex }
        return s
      }),
    )
    const res = await fetch(`/api/binders/${binder.id}/slots/swap`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotAId, slotBId }),
    })
    if (!res.ok) {
      setSlots((prev) =>
        prev.map((s) => {
          if (s.id === slotAId) return { ...s, pageNumber: slotA.pageNumber, slotIndex: slotA.slotIndex }
          if (s.id === slotBId) return { ...s, pageNumber: slotB.pageNumber, slotIndex: slotB.slotIndex }
          return s
        }),
      )
    }
  }

  const handleToggleStatus = async (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return
    const newStatus = slot.status === 'owned' ? 'wanted' : 'owned'
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, status: newStatus } : s)))
    const res = await fetch(`/api/binders/${binder.id}/slots/${slotId}/status`, { method: 'PATCH' })
    if (!res.ok) {
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, status: slot.status } : s)))
    }
  }

  const handleMove = async (slotId: string, pageNumber: number, slotIndex: number) => {
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return
    const prevPage = slot.pageNumber
    const prevIndex = slot.slotIndex
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, pageNumber, slotIndex } : s)),
    )
    const res = await fetch(`/api/binders/${binder.id}/slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageNumber, slotIndex }),
    })
    if (!res.ok) {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, pageNumber: prevPage, slotIndex: prevIndex } : s,
        ),
      )
    }
  }

  const handleAddPage = async () => {
    const res = await fetch(`/api/binders/${binder.id}/pages`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setTotalPages(data.totalPages)
    }
  }

  const handlePageDelete = (pageNumber: number, newSlots: SlotWithCard[]) => {
    setSlots(newSlots)
    setSpreadIndex((prev) => {
      const newSpreadCount = buildSpreads(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          buildGridPages(newSlots, gridType, totalPages - 1).get(i + 1) ?? [],
        ),
      ).length
      return Math.min(prev, Math.max(newSpreadCount - 1, 0))
    })
    setMobilePageIndex((prev) => Math.min(prev, totalPages - 1))
  }

  const handlePageReorder = (newSlots: SlotWithCard[]) => {
    setSlots(newSlots)
  }

  const handleSettingsUpdate = (updated: {
    name: string
    gridType: GridType
    coverColor: string
    newSlots?: SlotWithCard[]
    newTotalPages?: number
  }) => {
    setBinderName(updated.name)
    setBInderGridType(updated.gridType)
    setBinderCoverColor(updated.coverColor)
    if (updated.newSlots !== undefined) setSlots(updated.newSlots)
    if (updated.newTotalPages !== undefined) setTotalPages(updated.newTotalPages)
  }

  const handleAddCard = (pageNumber: number, slotIndex: number) => {
    setPickerTarget({ pageNumber, slotIndex })
  }

  const handleConfirmAddCard = async (cardId: string, status: CardStatus) => {
    if (!pickerTarget) return
    const res = await fetch(`/api/binders/${binder.id}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pickerTarget, cardId, status }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err?.error ?? '加入失敗，請重試')
      return
    }
    const result: SlotCardResult = await res.json()
    setSlots((prev) => [
      ...prev,
      {
        id: result.slot.id,
        binderId: binder.id,
        cardId: result.userCard.cardId,
        pageNumber: result.slot.pageNumber,
        slotIndex: result.slot.slotIndex,
        status: result.slot.status,
        card: result.slot.card,
      },
    ])
    setPickerTarget(null)
    toast.success('已加入卡片')
  }

  const handleViewCard = async (cardId: string) => {
    const res = await fetch(`/api/cards/${cardId}`)
    if (!res.ok) {
      toast.error('讀取卡牌資料失敗')
      return
    }
    setViewCard(await res.json())
  }

  const handleJumpToSlot = (slot: SlotWithCard) => {
    if (isMobile) {
      setMobilePageIndex(slot.pageNumber)
    } else {
      setSpreadIndex(pageNumberToSpreadIndex(slot.pageNumber))
    }

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
    setHighlightedSlotId(slot.id)
    highlightTimeoutRef.current = setTimeout(() => setHighlightedSlotId(null), 2000)

    requestAnimationFrame(() => {
      document
        .querySelector(`[data-testid="slot-card-${slot.id}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const sharedHandlers = {
    onDelete: handleDelete,
    onSwap: handleSwap,
    onToggleStatus: handleToggleStatus,
    onMove: handleMove,
    onAddCard: handleAddCard,
    onView: handleViewCard,
    highlightedSlotId,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/binders" aria-label="返回卡冊列表" data-testid="back-to-binders">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{binderName}</h1>
        </div>
        <BinderSettingsDrawer
          binderId={binder.id}
          binderName={binderName}
          gridType={binderGridType}
          coverColor={binderCoverColor}
          totalPages={totalPages}
          onSettingsUpdate={handleSettingsUpdate}
          onPageDelete={handlePageDelete}
          onPageReorder={handlePageReorder}
          onTotalPagesChange={setTotalPages}
          slots={slots}
          onJumpToSlot={handleJumpToSlot}
        />
      </div>
      <BinderSpreadView
        spreads={spreads}
        spreadIndex={spreadIndex}
        onSpreadChange={setSpreadIndex}
        coverColor={binderCoverColor}
        gridType={gridType}
        onAddPage={handleAddPage}
        {...sharedHandlers}
      />
      <BinderMobileView
        mobilePages={mobilePages}
        pageIndex={mobilePageIndex}
        onPageChange={setMobilePageIndex}
        coverColor={binderCoverColor}
        gridType={gridType}
        onAddPage={handleAddPage}
        {...sharedHandlers}
      />
      <SlotCardPickerDialog
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onConfirm={handleConfirmAddCard}
      />
      <CardDetailDrawer
        card={viewCard}
        open={viewCard !== null}
        onClose={() => setViewCard(null)}
        hideAddToBinder
      />
    </div>
  )
}
