'use client'

import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { WantedRankCard } from '@/types/homepage'

const PODIUM_ORDER = [1, 0, 2] // display order: 2nd | 1st | 3rd (index into top3)

const RANK_CONFIG = [
  { label: '🥇', color: 'bg-yellow-400/20 border-yellow-400', height: 'h-24', textColor: 'text-yellow-500' },
  { label: '🥈', color: 'bg-slate-400/20 border-slate-400', height: 'h-16', textColor: 'text-slate-400' },
  { label: '🥉', color: 'bg-amber-700/20 border-amber-600', height: 'h-12', textColor: 'text-amber-600' },
]

interface PodiumSectionProps {
  ptcgWanted: WantedRankCard[]
  opcgWanted: WantedRankCard[]
  selectedGame: 'PTCG' | 'OPCG'
  onGameChange: (game: 'PTCG' | 'OPCG') => void
}

export function PodiumSection({ ptcgWanted, opcgWanted, selectedGame, onGameChange }: PodiumSectionProps) {
  const top3 = (selectedGame === 'PTCG' ? ptcgWanted : opcgWanted).slice(0, 3)

  return (
    <section
      className="min-h-screen snap-start flex flex-col items-center justify-center gap-8 py-16 px-4"
      data-testid="podium-section"
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
        <div className="flex items-center justify-between w-full">
          <div>
            <h2 className="text-3xl font-bold">最多人想要</h2>
            <p className="text-muted-foreground text-sm mt-1">玩家收藏夢幻逸品排行</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Tabs value={selectedGame} onValueChange={(v) => onGameChange(v as 'PTCG' | 'OPCG')}>
              <TabsList>
                <TabsTrigger value="PTCG">Pokémon</TabsTrigger>
                <TabsTrigger value="OPCG">One Piece</TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              即將推出：分享你的卡冊 ✨
            </Badge>
          </div>
        </div>
      </div>

      {/* Podium */}
      {top3.length === 0 ? (
        <p className="text-muted-foreground py-12">目前尚無想要資料</p>
      ) : (
        <div className="flex items-end justify-center gap-4 sm:gap-8 w-full max-w-2xl">
          {PODIUM_ORDER.map((rankIdx) => {
            const card = top3[rankIdx]
            if (!card) return null
            const cfg = RANK_CONFIG[rankIdx]
            const rank = rankIdx + 1

            return (
              <div
                key={card.cardId}
                className="flex flex-col items-center gap-3 flex-1 max-w-[160px]"
                data-testid="podium-card"
              >
                {/* Card image */}
                <div className="w-full aspect-[2/3] rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
                  <img
                    src={card.imageSmall}
                    alt={card.zhName ?? card.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Card info */}
                <div className="text-center w-full">
                  <p className="text-sm font-semibold truncate">{card.zhName ?? card.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{card.zhSetName ?? card.setName}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-sm font-bold">{card.wantedCount}</span>
                    <span className="text-xs text-muted-foreground">人想要</span>
                  </div>
                </div>

                {/* Pedestal */}
                <div
                  className={`w-full rounded-t-lg border-2 flex flex-col items-center justify-start pt-2 ${cfg.color} ${cfg.height}`}
                >
                  <span className="text-2xl" aria-label={`第 ${rank} 名`}>{cfg.label}</span>
                  <span className={`text-xs font-bold ${cfg.textColor}`}>#{rank}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
