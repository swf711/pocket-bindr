'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { CardItem } from './card-item'

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

interface CardGridProps {
  cards: CardData[]
  onToggle: (cardId: string, status: string | null) => void
  loading?: boolean
}

const gridClassName =
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'

export function CardGrid({ cards, onToggle, loading = false }: CardGridProps) {
  if (loading) {
    return (
      <div data-testid="card-grid-loading" className={gridClassName}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-2.5/3.5 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (cards.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">沒有找到卡牌</div>
  }

  return (
    <div data-testid="card-grid" className={gridClassName}>
      {cards.map(card => (
        <CardItem key={card.id} card={card} onToggle={onToggle} />
      ))}
    </div>
  )
}
