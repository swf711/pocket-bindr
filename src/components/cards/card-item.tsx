'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CardWithCollectionStatus } from '@/types/card'
import { getCardImageUrl } from '@/lib/get-card-image-url'

interface CardItemProps {
  card: CardWithCollectionStatus
  onClick: (card: CardWithCollectionStatus) => void
  href?: string
}

const cardItemClassName =
  'group relative aspect-2.5/3.5 w-full overflow-hidden ' +
  'rounded-lg cursor-pointer shadow-sm transition-all hover:scale-105 hover:shadow-lg focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-ring'

export function CardItem({ card, onClick, href }: CardItemProps) {
  const t = useTranslations('cards')
  const displayImageSmall = !card.isCollectible && card.canonicalCard
    ? card.canonicalCard.imageSmall
    : card.imageSmall
  const resolvedImageUrl = getCardImageUrl(displayImageSmall)

  const content = resolvedImageUrl ? (
    <img
      src={resolvedImageUrl}
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
      <span className="text-xs">{t('noImage')}</span>
    </div>
  )

  // href 存在時（搜尋頁）render 為 <Link>，觸發 Next.js Intercepting Route 攔截；
  // 不傳（binder/public/collection 三處）維持既有 button + onClick，行為零變。
  if (href) {
    return (
      <Link href={href} data-testid="card-item" className={cardItemClassName}>
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={() => onClick(card)}
      data-testid="card-item"
      className={cardItemClassName}
    >
      {content}
    </button>
  )
}
