'use client'

interface CardData {
  id: string
  name: string
  imageSmall: string
  rarity: string | null
  cardNumber: string
  collectionStatus: string | null
  set: { name: string }
}

interface CardItemProps {
  card: CardData
  onToggle: (cardId: string, status: string | null) => void
}

export function CardItem({ card, onToggle }: CardItemProps) {
  const isOwned = card.collectionStatus === 'owned'
  const isWanted = card.collectionStatus === 'wanted'

  return (
    <div data-testid="card-item" className="group relative rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[2.5/3.5] relative">
        <img
          src={card.imageSmall}
          alt={card.name}
          className={`w-full h-full object-cover ${isWanted ? 'grayscale' : ''}`}
          loading="lazy"
        />
      </div>
      <div className="p-2">
        <p className="text-sm font-medium truncate">{card.name}</p>
        <p className="text-xs text-gray-500">{card.set.name} #{card.cardNumber}</p>
        <div className="flex gap-1 mt-1">
          <button
            data-testid="btn-owned"
            onClick={() => onToggle(card.id, isOwned ? null : 'owned')}
            className={`flex-1 py-1 text-xs rounded transition-colors ${
              isOwned ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            ✓ 擁有
          </button>
          <button
            data-testid="btn-wanted"
            onClick={() => onToggle(card.id, isWanted ? null : 'wanted')}
            className={`flex-1 py-1 text-xs rounded transition-colors ${
              isWanted ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            ♡ 想要
          </button>
        </div>
      </div>
    </div>
  )
}
