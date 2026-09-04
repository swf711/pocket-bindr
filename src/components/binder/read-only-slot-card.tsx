'use client'

import { isMultiNumberCard } from '@/lib/card-number'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import { CardImage } from '../cards/card-image'
import { SpanCardImage } from './span-card-image'
import { SlotLabelBadges } from './slot-label-badges'
import type { SlotWithCard } from '@/types/binder'

interface ReadOnlySlotCardProps {
  slot: SlotWithCard
  onView?: (cardId: string) => void
  /** 抵銷 Snowglobe 縮放，讓標籤文字維持可讀大小（見 SlotLabelBadges） */
  counterScale?: number
}

export function ReadOnlySlotCard({ slot, onView, counterScale = 1 }: ReadOnlySlotCardProps) {
  const imageUrl = getCardImageUrl(slot.card.imageSmall)
  // 複數卡佔 1 格（未跨格）時顯示的是整張合成圖，比例與標準卡不同，
  // object-cover 會裁成中央一條而認不出是哪張卡，故改 object-contain（見 card-number.ts）。
  const objectFit = isMultiNumberCard(slot.card.cardNumber) ? 'object-contain' : 'object-cover'
  const nameFallback = (
    <div className="flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground">
      <span className="text-xs text-center px-1">{slot.card.name}</span>
    </div>
  )

  return (
    <div
      className={`relative w-full aspect-5/7 overflow-hidden rounded-md border border-border bg-card${
        onView ? ' cursor-pointer transition-opacity hover:opacity-80' : ''
      }`}
      onClick={onView ? () => onView(slot.card.id) : undefined}
    >
      {slot.span ? (
        <SpanCardImage
          src={slot.span.imageUrl ? getCardImageUrl(slot.span.imageUrl) : imageUrl}
          alt={slot.card.name}
          span={slot.span}
          grayscale={slot.status === 'wanted'}
          fallback={nameFallback}
        />
      ) : (
        <CardImage
          src={imageUrl}
          alt={slot.card.name}
          className={`h-full w-full ${objectFit}${slot.status === 'wanted' ? ' grayscale' : ''}`}
          loading="lazy"
          draggable={false}
          fallback={nameFallback}
        />
      )}

      <SlotLabelBadges slot={slot} counterScale={counterScale} />
    </div>
  )
}
