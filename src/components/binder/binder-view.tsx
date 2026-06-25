'use client'

import { useRef, useState } from 'react'
import { GridType, CardStatus } from '@prisma/client'
import { toast } from 'sonner'
import { BinderSpreadView } from './binder-spread-view'
import { BinderMobileView } from './binder-mobile-view'
import { BinderSettingsDrawer } from './binder-settings-drawer'
import { SlotCardPickerDialog } from './slot-card-picker-dialog'
import { CardDetailDrawer } from '@/components/cards/card-detail-drawer'
import type { BinderDetailResponse, SlotWithCard, SlotCardResult } from '@/types/binder'
import type { CardWithCollectionStatus } from '@/types/card'
import { buildGridPages, buildSpreads, buildMobilePages, pageNumberToSpreadIndex, findNextEmptySlot } from '@/lib/binder-utils'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { useSwapSlots } from '@/hooks/use-swap-slots'
import { useAddToBinder } from '@/hooks/use-add-to-binder'

export function BinderView({ binder }: { binder: BinderDetailResponse }) {
  const [slots, setSlots] = useState<SlotWithCard[]>(binder.slots)
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [mobilePageIndex, setMobilePageIndex] = useState(0)
  const [totalPages, setTotalPages] = useState(binder.settings?.totalPages ?? 1)
  const [binderName, setBinderName] = useState(binder.name)
  const [binderGridType, setBInderGridType] = useState<GridType>(binder.gridType as GridType)
  const [binderCoverColor, setBinderCoverColor] = useState(binder.coverColor)
  const [binderDescription, setBinderDescription] = useState(binder.description)
  const [shareToken, setShareToken] = useState<string | null>(binder.shareToken)
  const [pickerTarget, setPickerTarget] = useState<{ pageNumber: number; slotIndex: number } | null>(null)
  const [viewCard, setViewCard] = useState<CardWithCollectionStatus | null>(null)
  const [highlightedSlotId, setHighlightedSlotId] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = useIsMobile()
  const swapSlots = useSwapSlots()
  const addToBinder = useAddToBinder()

  const gridType = binderGridType
  const pages = buildGridPages(slots, gridType, totalPages)
  const pagesArray = Array.from({ length: totalPages }, (_, i) => pages.get(i + 1) ?? [])
  const spreads = buildSpreads(pagesArray)
  const mobilePages = buildMobilePages(pagesArray)

  const handleDelete = async (slotId: string) => {
    await fetch(`/api/binders/${binder.id}/slots/${slotId}`, { method: 'DELETE' })
    setSlots((prev) => prev.filter((s) => s.id !== slotId))
  }

  const handleSwap = (slotAId: string, slotBId: string) => {
    const slotA = slots.find((s) => s.id === slotAId)
    const slotB = slots.find((s) => s.id === slotBId)
    if (!slotA || !slotB) return

    // optimistic local update
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotAId) return { ...s, pageNumber: slotB.pageNumber, slotIndex: slotB.slotIndex }
        if (s.id === slotBId) return { ...s, pageNumber: slotA.pageNumber, slotIndex: slotA.slotIndex }
        return s
      }),
    )

    swapSlots.mutate(
      { binderId: binder.id, slotAId, slotBId },
      {
        onError: () => {
          // rollback local state
          setSlots((prev) =>
            prev.map((s) => {
              if (s.id === slotAId)
                return { ...s, pageNumber: slotA.pageNumber, slotIndex: slotA.slotIndex }
              if (s.id === slotBId)
                return { ...s, pageNumber: slotB.pageNumber, slotIndex: slotB.slotIndex }
              return s
            }),
          )
        },
      },
    )
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
    if (res.status === 409) {
      toast.error('卡冊最多 100 頁')
      return
    }
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
    description?: string | null
    newSlots?: SlotWithCard[]
    newTotalPages?: number
  }) => {
    setBinderName(updated.name)
    setBInderGridType(updated.gridType)
    setBinderCoverColor(updated.coverColor)
    if (updated.description !== undefined) setBinderDescription(updated.description)
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

  const handleAddToBinderFromDrawer = async (
    binderId: string,
    status: CardStatus,
    quantity: number,
  ) => {
    if (!viewCard) return
    const result = await addToBinder.mutateAsync({ card: viewCard, binderId, status, quantity })
    // 加入「此卡冊」（正在看的卡冊）→ 立即重抓格位反映新增；GET 不回 totalPages，故用 POST 回傳值
    if (binderId === binder.id) {
      if (result.updatedTotalPages) setTotalPages(result.updatedTotalPages)
      const res = await fetch(`/api/binders/${binder.id}`)
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots)
      }
    }
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

  const handleCopyCard = async (slotId: string) => {
    const src = slots.find((s) => s.id === slotId)
    if (!src) return

    // 同頁優先找下一個空格；全卡冊皆滿則自動新增一頁
    let target = findNextEmptySlot(pages, totalPages, src.pageNumber)
    if (!target) {
      const pageRes = await fetch(`/api/binders/${binder.id}/pages`, { method: 'POST' })
      if (pageRes.status === 409) {
        toast.error('卡冊最多 100 頁')
        return
      }
      if (!pageRes.ok) {
        toast.error('複製失敗，請重試')
        return
      }
      const data = await pageRes.json()
      setTotalPages(data.totalPages)
      target = { pageNumber: data.totalPages, slotIndex: 0 }
    }

    const res = await fetch(`/api/binders/${binder.id}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...target, cardId: src.cardId, status: src.status }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err?.error ?? '複製失敗，請重試')
      return
    }
    const result: SlotCardResult = await res.json()
    const newSlot: SlotWithCard = {
      id: result.slot.id,
      binderId: binder.id,
      cardId: result.userCard.cardId,
      pageNumber: result.slot.pageNumber,
      slotIndex: result.slot.slotIndex,
      status: result.slot.status,
      card: result.slot.card,
    }
    setSlots((prev) => [...prev, newSlot])
    handleJumpToSlot(newSlot)
    toast.success('已複製卡片')
  }

  const sharedHandlers = {
    onDelete: handleDelete,
    onSwap: handleSwap,
    onToggleStatus: handleToggleStatus,
    onMove: handleMove,
    onAddCard: handleAddCard,
    onView: handleViewCard,
    onCopy: handleCopyCard,
    highlightedSlotId,
  }

  const settingsDrawer = (
    <BinderSettingsDrawer
      binderId={binder.id}
      binderName={binderName}
      binderDescription={binderDescription}
      gridType={binderGridType}
      coverColor={binderCoverColor}
      totalPages={totalPages}
      shareToken={shareToken}
      onSettingsUpdate={handleSettingsUpdate}
      onPageDelete={handlePageDelete}
      onPageReorder={handlePageReorder}
      onTotalPagesChange={setTotalPages}
      onShareTokenChange={setShareToken}
    />
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 h-[calc(100vh-57px)] p-4">
      <BinderSpreadView
        spreads={spreads}
        spreadIndex={spreadIndex}
        onSpreadChange={setSpreadIndex}
        coverColor={binderCoverColor}
        binderName={binderName}
        description={binderDescription}
        slots={slots}
        totalPages={totalPages}
        gridType={gridType}
        onJumpToSlot={handleJumpToSlot}
        onAddPage={handleAddPage}
        settingsSlot={settingsDrawer}
        {...sharedHandlers}
      />
      <BinderMobileView
        mobilePages={mobilePages}
        pageIndex={mobilePageIndex}
        onPageChange={setMobilePageIndex}
        coverColor={binderCoverColor}
        binderName={binderName}
        description={binderDescription}
        slots={slots}
        totalPages={totalPages}
        gridType={gridType}
        onJumpToSlot={handleJumpToSlot}
        onAddPage={handleAddPage}
        settingsSlot={settingsDrawer}
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
        onAddToBinder={handleAddToBinderFromDrawer}
        currentBinderId={binder.id}
      />
    </div>
  )
}
