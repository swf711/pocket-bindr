'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const GAME_IDS = ['PTCG', 'OPCG'] as const

const CARD_BACK_IMAGES: Record<(typeof GAME_IDS)[number], string> = {
  PTCG: '/PTCG.png',
  OPCG: '/OPCG.jpeg',
}

interface GameSelectorProps {
  selected: string | null
  onSelect: (game: string) => void
}

export function GameSelector({ selected, onSelect }: GameSelectorProps) {
  const t = useTranslations('cards')
  const games = GAME_IDS.map((id) => ({ id, label: t(`games.${id}`), image: CARD_BACK_IMAGES[id] }))
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
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
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
      <button
        type="button"
        disabled
        data-testid="game-btn-coming-soon"
        className="flex cursor-not-allowed flex-col items-center gap-3 rounded-lg border border-input bg-card p-6 text-card-foreground opacity-60 shadow-xs"
      >
        <Image
          src="/placeholder-card-back.svg"
          alt={t('moreComingSoon')}
          width={120}
          height={168}
          className="rounded-md"
        />
        <span className="text-lg font-semibold">{t('moreComingSoon')}</span>
      </button>
    </div>
  )
}
