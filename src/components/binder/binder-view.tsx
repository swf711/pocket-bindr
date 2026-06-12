'use client'

import { useState } from 'react'
import { GridType } from '@prisma/client'
import { BinderSpreadView } from './binder-spread-view'
import { BinderMobileView } from './binder-mobile-view'
import type { BinderDetailResponse, SlotWithCard } from '@/types/binder'
import { buildGridPages, buildSpreads, buildMobilePages } from '@/lib/binder-utils'

export function BinderView({ binder }: { binder: BinderDetailResponse }) {
  const [slots, setSlots] = useState<SlotWithCard[]>(binder.slots)
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [mobilePageIndex, setMobilePageIndex] = useState(0)

  const gridType = binder.gridType as GridType
  const pages = buildGridPages(slots, gridType)
  const totalPages = Math.max(pages.size, 1)
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

  const sharedHandlers = {
    onDelete: handleDelete,
    onSwap: handleSwap,
    onToggleStatus: handleToggleStatus,
    onMove: handleMove,
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{binder.name}</h1>
      <BinderSpreadView
        spreads={spreads}
        spreadIndex={spreadIndex}
        onSpreadChange={setSpreadIndex}
        coverColor={binder.coverColor}
        gridType={gridType}
        {...sharedHandlers}
      />
      <BinderMobileView
        mobilePages={mobilePages}
        pageIndex={mobilePageIndex}
        onPageChange={setMobilePageIndex}
        coverColor={binder.coverColor}
        gridType={gridType}
        {...sharedHandlers}
      />
    </div>
  )
}
