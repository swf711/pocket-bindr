'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface CollectionStatus {
  owned: number | null
  wanted: number | null
}

interface CardData {
  id: string
  name: string
  imageSmall: string
  rarity: string | null
  cardNumber: string
  collectionStatus: CollectionStatus
  set: { name: string }
}

interface CardItemProps {
  card: CardData
  onToggle: (cardId: string, status: string | null, deleteStatus?: string) => void
}

export function CardItem({ card, onToggle }: CardItemProps) {
  const isOwned = card.collectionStatus.owned !== null
  const isWanted = card.collectionStatus.wanted !== null

  return (
    <Card
      data-testid="card-item"
      className="group relative gap-0 overflow-hidden rounded-lg py-0 transition-transform hover:-translate-y-2.5 cursor-pointer"
    >
      <div className="aspect-2.5/3.5 relative">
        {card.imageSmall ? (
          <img
            src={card.imageSmall}
            alt={card.name}
            className={`w-full h-full object-cover ${isWanted && !isOwned ? 'grayscale' : ''}`}
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
            onClick={() => isOwned ? onToggle(card.id, null, 'owned') : onToggle(card.id, 'owned')}
            className="flex-1 h-6 text-xs"
          >
            ✓ 擁有
          </Button>
          <Button
            data-testid="btn-wanted"
            size="sm"
            variant={isWanted ? 'default' : 'secondary'}
            onClick={() => isWanted ? onToggle(card.id, null, 'wanted') : onToggle(card.id, 'wanted')}
            className="flex-1 h-6 text-xs"
          >
            ♡ 想要
          </Button>
        </div>
      </div>
    </Card>
  )
}
