'use client'

import { useState } from 'react'
import { GridType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { BinderGrid } from './binder-grid'
import type { BinderDetailResponse, SlotWithCard } from '@/types/binder'
import { buildGridPages } from '@/lib/binder-utils'

export { buildGridPages }

export function BinderView({ binder }: { binder: BinderDetailResponse }) {
  const [slots, setSlots] = useState<SlotWithCard[]>(binder.slots)
  const [currentPage, setCurrentPage] = useState(1)

  const gridType = binder.gridType as GridType
  const pages = buildGridPages(slots, gridType)
  const totalPages = Math.max(pages.size, 1)
  const currentSlots = pages.get(currentPage) ?? []

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{binder.name}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            ← Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next →
          </Button>
        </div>
      </div>
      <BinderGrid
        slots={currentSlots}
        gridType={gridType}
        onDelete={handleDelete}
        onSwap={handleSwap}
        onMove={handleMove}
      />
    </div>
  )
}
