'use client'

import { CardItem } from './card-item'

interface CardData {
  id: string
  name: string
  imageSmall: string
  rarity: string | null
  cardNumber: string
  collectionStatus: string | null
  set: { name: string }
}

interface CardGridProps {
  cards: CardData[]
  onToggle: (cardId: string, status: string | null) => void
}

export function CardGrid({ cards, onToggle }: CardGridProps) {
  if (cards.length === 0) {
    return <div className="text-center py-12 text-gray-500">沒有找到卡牌</div>
  }
  return (
    <div data-testid="card-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {cards.map(card => (
        <CardItem key={card.id} card={card} onToggle={onToggle} />
      ))}
    </div>
  )
}
