'use client'

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
        <button
          key={g.id}
          data-testid={`game-btn-${g.id.toLowerCase()}`}
          onClick={() => onSelect(g.id)}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            selected === g.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {g.label}
        </button>
      ))}
    </div>
  )
}
