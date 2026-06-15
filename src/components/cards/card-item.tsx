'use client'
import { CardWithCollectionStatus } from '@/types/card'
import { getCardImageUrl } from '@/lib/get-card-image-url'

interface CardItemProps {
  card: CardWithCollectionStatus
  onClick: (card: CardWithCollectionStatus) => void
}

export function CardItem({ card, onClick }: CardItemProps) {
  const displayImageSmall = !card.isCollectible && card.canonicalCard
    ? card.canonicalCard.imageSmall
    : card.imageSmall

  return (
    <button
      onClick={() => onClick(card)}
      data-testid="card-item"
      className="group relative aspect-2.5/3.5 w-full overflow-hidden
                 rounded-lg cursor-pointer shadow-sm transition-all hover:scale-105 hover:shadow-lg focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-ring"
    >
      {getCardImageUrl(displayImageSmall) ? (
        <img
          src={getCardImageUrl(displayImageSmall)!}
          alt={card.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          data-testid="card-image-fallback"
          className="flex h-full w-full flex-col items-center
                     justify-center bg-muted text-muted-foreground"
        >
          <span className="text-xs">{card.name}</span>
          <span className="text-xs">無圖片</span>
        </div>
      )}
    </button>
  )
}
