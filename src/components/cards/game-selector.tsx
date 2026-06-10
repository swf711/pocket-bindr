'use client'

import { Button } from '@/components/ui/button'

const games = [
  { id: 'PTCG', label: 'Pokemon TCG' },
  { id: 'OPCG', label: 'One Piece TCG' },
]

interface GameSelectorProps {
  selected: string | null
  onSelect: (game: string) => void
}

export function GameSelector({ selected, onSelect }: GameSelectorProps) {
  return (
    <div data-testid="game-selector" className="flex gap-3">
      {games.map(g => (
        <Button
          key={g.id}
          data-testid={`game-btn-${g.id.toLowerCase()}`}
          variant={selected === g.id ? 'default' : 'outline'}
          size="lg"
          onClick={() => onSelect(g.id)}
        >
          {g.label}
        </Button>
      ))}
    </div>
  )
}
