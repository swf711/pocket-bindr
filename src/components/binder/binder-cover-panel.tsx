'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { GridType } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import { computeBinderStats } from '@/lib/binder-utils'
import { MAX_PAGES_PER_BINDER } from '@/lib/binder-limits'
import type { SlotWithCard } from '@/types/binder'

interface BinderCoverPanelProps {
  binderName: string
  description?: string | null
  slots: SlotWithCard[]
  gridType: GridType
  totalPages: number
  onJumpToSlot: (slot: SlotWithCard) => void
  counterScale?: number
}

const BINDER_NAME_HEIGHT = 40
const DESCRIPTION_LINE_HEIGHT = 25
const PAGES_SECTION_HEIGHT = 32
const CARDS_SECTION_HEIGHT = 32
const COLLECTION_SECTION_HEIGHT = 32
const SEARCH_INPUT_HEIGHT = 28

export function BinderCoverPanel({
  binderName,
  description,
  slots,
  gridType,
  totalPages,
  onJumpToSlot,
  counterScale = 1,
}: BinderCoverPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const { ownedCount, wantedCount, totalSlots } = computeBinderStats(slots, gridType, totalPages)
  const pagesProgress = (totalPages / MAX_PAGES_PER_BINDER) * 100
  const cardsProgress = totalSlots > 0 ? (slots.length / totalSlots) * 100 : 0
  const collectionProgress = totalSlots > 0 ? (ownedCount / (ownedCount + wantedCount)) * 100 : 0

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
      className="w-full h-full p-4 flex justify-center flex-col overflow-hidden"
    >
      <div className="dark text-white bg-black/50 rounded-md p-4 flex flex-col gap-2">
        {/* 卡冊標題 */}
        <div
          className="flex items-start justify-center overflow-hidden"
          style={{
            transform: `scale(${counterScale})`,
            transformOrigin: 'top left',
            width: `${100 / counterScale}%`,
            height: BINDER_NAME_HEIGHT * counterScale,
          }}
        >
          <h1 className="text-4xl font-black truncate text-center select-none break-all">
            {binderName}
          </h1>
        </div>

        {/* 描述 */}
        {description && (
          <div style={{ height: DESCRIPTION_LINE_HEIGHT * counterScale, overflow: 'visible' }}>
            <div
              style={{
                transform: `scale(${counterScale})`,
                transformOrigin: 'top left',
                width: `${100 / counterScale}%`,
              }}
            >
              <p className="text-sm text-muted-foreground truncate text-center">{description}</p>
            </div>
          </div>
        )}

        {/* 頁數區塊 */}
        <hr />
        <div style={{ height: PAGES_SECTION_HEIGHT * counterScale, overflow: 'visible' }}>
          <div
            style={{
              transform: `scale(${counterScale})`,
              transformOrigin: 'top left',
              width: `${100 / counterScale}%`,
            }}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span>內頁</span>
              <div>
                <span>{totalPages}</span>
                <span className="text-muted-foreground"> / {MAX_PAGES_PER_BINDER} 頁</span>
              </div>
            </div>
            <Progress value={pagesProgress} />
          </div>
        </div>

        {/* 卡片統計 */}
        <hr />
        <div style={{ height: CARDS_SECTION_HEIGHT * counterScale, overflow: 'visible' }}>
          <div
            style={{
              transform: `scale(${counterScale})`,
              transformOrigin: 'top left',
              width: `${100 / counterScale}%`,
            }}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span>卡片</span>
              <div>
                <span>{slots.length}</span>
                <span className="text-muted-foreground"> / {totalSlots} 格卡槽</span>
              </div>
            </div>
            <Progress
              value={cardsProgress}
              data-testid="binder-cover-progress"
            />
          </div>
        </div>

        {/* 收藏狀態 */}
        <hr />
        <div style={{ height: COLLECTION_SECTION_HEIGHT * counterScale, overflow: 'visible' }}>
          <div
            style={{
              transform: `scale(${counterScale})`,
              transformOrigin: 'top left',
              width: `${100 / counterScale}%`,
            }}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span>收藏狀態</span>
              <span>擁有 {ownedCount} / 想要 {wantedCount}</span>
            </div>
            <Progress
              value={collectionProgress}
              data-testid="binder-cover-progress"
            />
          </div>
        </div>

        {/* 搜尋 */}
        <hr className="border-white/10" />
        <div style={{ height: SEARCH_INPUT_HEIGHT * counterScale, overflow: 'visible' }}>
          <div
            style={{
              transform: `scale(${counterScale})`,
              transformOrigin: 'top left',
              width: `${100 / counterScale}%`,
            }}
          >
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
          </div>
        </div>

        {/* 搜尋結果 - 動態高度 */}
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
                  <span className="text-xs text-white/50 ml-auto shrink-0">
                    第 {slot.pageNumber} 頁
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
