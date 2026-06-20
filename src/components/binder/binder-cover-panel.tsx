'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { GridType } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import { computeBinderStats } from '@/lib/binder-utils'
import type { SlotWithCard } from '@/types/binder'

interface BinderCoverPanelProps {
  binderName: string
  slots: SlotWithCard[]
  gridType: GridType
  totalPages: number
  onJumpToSlot: (slot: SlotWithCard) => void
  counterScale?: number
}

export function BinderCoverPanel({
  binderName,
  slots,
  gridType,
  totalPages,
  onJumpToSlot,
  counterScale = 1,
}: BinderCoverPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const { ownedCount, wantedCount, totalSlots } = computeBinderStats(slots, gridType, totalPages)
  const progressValue = totalSlots > 0 ? (ownedCount / totalSlots) * 100 : 0

  const searchResults = searchQuery.trim()
    ? slots.filter((s) => s.card.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : []

  function handleResultClick(slot: SlotWithCard) {
    setSearchQuery('')
    onJumpToSlot(slot)
  }

  return (
    <div
      data-testid="binder-cover-panel"
      data-droppable="false"
      className="w-full h-full rounded-md flex flex-col overflow-hidden"
    >
      {/* name watermark */}
      <div className="flex-1 flex items-start justify-center p-4 overflow-hidden">
        <p
          className="text-4xl font-black text-center leading-tight select-none break-all"
          style={{ color: 'rgba(255,255,255,0.18)', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
        >
          {binderName}
        </p>
      </div>

      {/* stats + search bottom panel */}
      <div className="shrink-0 rounded-b-md" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
        {/* counter-scale wrapper: scales content up from bottom-left to remain readable when Snowglobe zooms out */}
        <div
          style={{
            transform: `scale(${counterScale})`,
            transformOrigin: 'bottom left',
            width: `${100 / counterScale}%`,
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {/* stats row */}
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>共 {slots.length} 張</span>
            <span>擁有 {ownedCount} ／ 想要 {wantedCount}</span>
          </div>

          {/* progress bar */}
          <Progress
            value={progressValue}
            className="h-1.5 bg-white/20"
            data-testid="binder-cover-progress"
          />

          {/* search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50 pointer-events-none" />
            <Input
              data-testid="cover-slot-search"
              type="text"
              placeholder="搜尋卡牌..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
            />
          </div>

          {/* search results */}
          {searchQuery.trim() && (
            <div
              className="flex flex-col gap-1 max-h-36 overflow-y-auto"
              data-testid="cover-slot-search-results"
            >
              {searchResults.length === 0 ? (
                <p className="text-xs text-white/50 px-1">查無符合的卡牌</p>
              ) : (
                searchResults.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleResultClick(slot)}
                    className="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-white/10 transition-colors"
                    data-testid={`cover-search-result-${slot.id}`}
                  >
                    <img
                      src={getCardImageUrl(slot.card.imageSmall) ?? ''}
                      alt={slot.card.name}
                      className="h-8 w-6 rounded-xs object-cover shrink-0"
                    />
                    <span className="text-xs text-white/90 truncate">{slot.card.name}</span>
                    <span className="text-xs text-white/50 ml-auto shrink-0">第 {slot.pageNumber} 頁</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
