'use client'

import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { CardWithCollectionStatus } from '@/types/card'
import { CardItem } from './card-item'

interface CardGridProps {
  cards: CardWithCollectionStatus[]
  onCardClick: (card: CardWithCollectionStatus) => void
  loading?: boolean
  /** 有值時卡片 render 為 <Link href>（觸發 Intercepting Route 攔截）；不傳則維持既有 onClick 行為。 */
  cardHref?: (card: CardWithCollectionStatus) => string
}

export const cardGridClassName =
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'

export function CardGrid({ cards, onCardClick, loading = false, cardHref }: CardGridProps) {
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
        <CardItem key={card.id} card={card} onClick={onCardClick} href={cardHref?.(card)} />
      ))}
    </div>
  )
}
