'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { WantedRankCard } from '@/types/homepage'

interface MostWantedSectionProps {
  ptcgWanted: WantedRankCard[]
  opcgWanted: WantedRankCard[]
  selectedGame: 'PTCG' | 'OPCG'
  onGameChange: (game: 'PTCG' | 'OPCG') => void
}

export function MostWantedSection({ ptcgWanted, opcgWanted, selectedGame, onGameChange }: MostWantedSectionProps) {
  const cards = selectedGame === 'PTCG' ? ptcgWanted : opcgWanted

  return (
    <section className="py-12" data-testid="most-wanted-section">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">最多人想要</h2>
        <Tabs value={selectedGame} onValueChange={(v) => onGameChange(v as 'PTCG' | 'OPCG')}>
          <TabsList>
            <TabsTrigger value="PTCG">Pokémon</TabsTrigger>
            <TabsTrigger value="OPCG">One Piece</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {cards.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">目前尚無想要資料</p>
      ) : (
        <ol className="space-y-2">
          {cards.map((card, index) => (
            <li
              key={card.cardId}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <span className="w-7 text-center text-sm font-bold text-muted-foreground shrink-0">
                {index + 1}
              </span>
              <div className="relative shrink-0 w-10 h-14 rounded overflow-hidden shadow-sm">
                <Image
                  src={card.imageSmall}
                  alt={card.zhName ?? card.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{card.zhName ?? card.name}</p>
                <p className="text-xs text-muted-foreground truncate">{card.zhSetName ?? card.setName}</p>
                {card.rarity && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {card.rarity}
                  </Badge>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{card.wantedCount}</p>
                <p className="text-xs text-muted-foreground">人想要</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
