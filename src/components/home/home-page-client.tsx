'use client'

import { useState } from 'react'
import { GameTabsSection } from '@/components/home/game-tabs-section'
import { MostWantedSection } from '@/components/home/most-wanted-section'
import type { GameTabData, WantedRankCard } from '@/types/homepage'

interface HomePageClientProps {
  ptcgData: GameTabData
  opcgData: GameTabData
  ptcgWanted: WantedRankCard[]
  opcgWanted: WantedRankCard[]
}

export function HomePageClient({ ptcgData, opcgData, ptcgWanted, opcgWanted }: HomePageClientProps) {
  const [selectedGame, setSelectedGame] = useState<'PTCG' | 'OPCG'>('PTCG')

  return (
    <>
      <GameTabsSection
        ptcgData={ptcgData}
        opcgData={opcgData}
        selectedGame={selectedGame}
        onGameChange={setSelectedGame}
      />
      <MostWantedSection
        ptcgWanted={ptcgWanted}
        opcgWanted={opcgWanted}
        selectedGame={selectedGame}
        onGameChange={setSelectedGame}
      />
    </>
  )
}
