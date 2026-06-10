'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
    <Card
      data-testid="card-item"
      className="group relative gap-0 overflow-hidden rounded-lg py-0 transition-shadow hover:shadow-md"
    >
      <div className="aspect-2.5/3.5 relative">
        {card.imageSmall ? (
          <img
            src={card.imageSmall}
            alt={card.name}
            className={`w-full h-full object-cover ${isWanted ? 'grayscale' : ''}`}
            loading="lazy"
          />
        ) : (
          <div
            data-testid="card-image-fallback"
            className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted p-2 text-center"
          >
            <p className="text-sm font-medium">{card.name}</p>
            <p className="text-xs text-muted-foreground">無圖片</p>
          </div>
        )}
        {card.rarity && (
          <Badge variant="secondary" className="absolute right-1 top-1">
            {card.rarity}
          </Badge>
        )}
      </div>
      <div className="p-2">
        <p className="text-sm font-medium truncate">{card.name}</p>
        <p className="text-xs text-muted-foreground">{card.set.name} #{card.cardNumber}</p>
        <div className="flex gap-1 mt-1">
          <Button
            data-testid="btn-owned"
            size="sm"
            variant={isOwned ? 'default' : 'secondary'}
            onClick={() => onToggle(card.id, isOwned ? null : 'owned')}
            className={`flex-1 h-6 text-xs ${
              isOwned ? 'bg-green-500 text-white hover:bg-green-600' : ''
            }`}
          >
            ✓ 擁有
          </Button>
          <Button
            data-testid="btn-wanted"
            size="sm"
            variant={isWanted ? 'default' : 'secondary'}
            onClick={() => onToggle(card.id, isWanted ? null : 'wanted')}
            className={`flex-1 h-6 text-xs ${
              isWanted ? 'bg-pink-500 text-white hover:bg-pink-600' : ''
            }`}
          >
            ♡ 想要
          </Button>
        </div>
      </div>
    </Card>
  )
}
