'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { CardDetailDrawer } from '@/components/cards/card-detail-drawer'
import type { GameTabData, ShowcaseCard } from '@/types/homepage'

const GAME_LABEL: Record<string, string> = {
  PTCG: 'Pokémon',
  OPCG: 'One Piece',
}

const LANG_LABEL: Record<string, string> = {
  EN: 'EN',
  JA: 'JA',
  ZH_TW: '繁中',
}

interface GameTabsSectionProps {
  ptcgData: GameTabData
  opcgData: GameTabData
  selectedGame: 'PTCG' | 'OPCG'
  onGameChange: (game: 'PTCG' | 'OPCG') => void
}

export function GameTabsSection({ ptcgData, opcgData, selectedGame, onGameChange }: GameTabsSectionProps) {
  const currentData = selectedGame === 'PTCG' ? ptcgData : opcgData
  const [selectedCard, setSelectedCard] = useState<ShowcaseCard | null>(null)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()

  const handleApiChange = useCallback((api: CarouselApi) => {
    setCarouselApi(api)
  }, [])

  useEffect(() => {
    if (!carouselApi) return
    const interval = setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext()
      } else {
        carouselApi.scrollTo(0)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [carouselApi])

  // reset carousel to first slide on tab change
  useEffect(() => {
    carouselApi?.scrollTo(0)
  }, [selectedGame, carouselApi])

  return (
    <section className="py-12" data-testid="game-tabs-section">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">精選卡牌</h2>
        <Tabs value={selectedGame} onValueChange={(v) => onGameChange(v as 'PTCG' | 'OPCG')}>
          <TabsList>
            <TabsTrigger value="PTCG">Pokémon</TabsTrigger>
            <TabsTrigger value="OPCG">One Piece</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Latest sets grid */}
      {currentData.latestSets.length > 0 && (
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-3">最新系列</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentData.latestSets.map((set) => (
              <Card key={set.id} className="overflow-hidden">
                <CardContent className="p-3 flex gap-3 items-center">
                  <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded bg-muted overflow-hidden">
                    {set.symbolUrl ? (
                      <img src={set.symbolUrl} alt={set.name} width={36} height={36} className="object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{set.externalId.slice(0, 4)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{set.name}</p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {GAME_LABEL[set.game] ?? set.game}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {LANG_LABEL[set.language] ?? set.language}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {set.releaseDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })}{' '}
                      · {set.totalCards} 張
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Card carousel */}
      {currentData.showcaseCards.length > 0 && (
        <div className="relative px-10">
          <Carousel
            opts={{ align: 'start', loop: true }}
            setApi={handleApiChange}
            className="w-full"
          >
            <CarouselContent>
              {currentData.showcaseCards.map((card) => (
                <CarouselItem key={card.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                  <button
                    type="button"
                    className="w-full flex flex-col items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      <img
                        src={card.imageSmall}
                        alt={card.zhName ?? card.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center w-full px-1">
                      <p className="text-xs font-medium truncate">{card.zhName ?? card.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{card.zhSetName ?? card.set.name}</p>
                    </div>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}

      <CardDetailDrawer
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        hideAddToBinder
      />
    </section>
  )
}
