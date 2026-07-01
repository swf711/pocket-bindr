'use client'

import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { CardWithCollectionStatus } from '@/types/card'
import { CardItem } from './card-item'

interface CardGridProps {
  cards: CardWithCollectionStatus[]
  onCardClick: (card: CardWithCollectionStatus) => void
  loading?: boolean
}

export const cardGridClassName =
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'

export function CardGrid({ cards, onCardClick, loading = false }: CardGridProps) {
  const t = useTranslations('cards')
  if (loading) {
    return (
      <div data-testid="card-grid-loading" className={cardGridClassName}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-2.5/3.5 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (cards.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{t('noResults')}</div>
  }

  return (
    <div data-testid="card-grid" className={cardGridClassName}>
      {cards.map(card => (
        <CardItem key={card.id} card={card} onClick={onCardClick} />
      ))}
    </div>
  )
}
