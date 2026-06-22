'use client'

import { useState } from 'react'
import { PodiumSection } from '@/components/home/podium-section'
import type { WantedRankCard } from '@/types/homepage'

interface HomePageClientProps {
  ptcgWanted: WantedRankCard[]
  opcgWanted: WantedRankCard[]
}

export function HomePageClient({ ptcgWanted, opcgWanted }: HomePageClientProps) {
  const [selectedGame, setSelectedGame] = useState<'PTCG' | 'OPCG'>('PTCG')

  return (
    <PodiumSection
      ptcgWanted={ptcgWanted}
      opcgWanted={opcgWanted}
      selectedGame={selectedGame}
      onGameChange={setSelectedGame}
    />
  )
}
