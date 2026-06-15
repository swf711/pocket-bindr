'use client'

import Image from 'next/image'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const games = [
  { id: 'PTCG', label: 'Pokemon TCG', image: '/placeholder-card-back.svg' },
  { id: 'OPCG', label: 'One Piece TCG', image: '/placeholder-card-back.svg' },
]

interface GameSelectorProps {
  selected: string | null
  onSelect: (game: string) => void
}

export function GameSelector({ selected, onSelect }: GameSelectorProps) {
  // 已選遊戲 → Tabs 呈現
  if (selected) {
    return (
      <Tabs
        data-testid="game-selector"
        value={selected}
        onValueChange={onSelect}
      >
        <TabsList>
          {games.map(g => (
            <TabsTrigger
              key={g.id}
              data-testid={`game-btn-${g.id.toLowerCase()}`}
              value={g.id}
            >
              {g.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    )
  }

  // 尚未選擇 → 大按鈕（遊戲圖 + label）
  return (
    <div
      data-testid="game-selector"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {games.map(g => (
        <button
          key={g.id}
          type="button"
          data-testid={`game-btn-${g.id.toLowerCase()}`}
          onClick={() => onSelect(g.id)}
          className="flex flex-col items-center gap-3 rounded-lg border border-input bg-card p-6 text-card-foreground shadow-xs transition-all hover:border-ring hover:shadow-md focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Image
            src={g.image}
            alt={g.label}
            width={120}
            height={168}
            className="rounded-md"
          />
          <span className="text-lg font-semibold">{g.label}</span>
        </button>
      ))}
    </div>
  )
}
