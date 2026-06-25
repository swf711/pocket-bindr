'use client'

import { getCardImageUrl } from '@/lib/get-card-image-url'
import type { SlotWithCard } from '@/types/binder'

interface ReadOnlySlotCardProps {
  slot: SlotWithCard
  onView?: (cardId: string) => void
}

export function ReadOnlySlotCard({ slot, onView }: ReadOnlySlotCardProps) {
  const imageUrl = getCardImageUrl(slot.card.imageSmall)

  return (
    <div
      className={`relative w-full aspect-5/7 overflow-hidden rounded-md border border-border bg-card${
        onView ? ' cursor-pointer transition-opacity hover:opacity-80' : ''
      }`}
      onClick={onView ? () => onView(slot.card.id) : undefined}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={slot.card.name}
          className={`h-full w-full object-cover${slot.status === 'wanted' ? ' grayscale' : ''}`}
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground">
          <span className="text-xs text-center px-1">{slot.card.name}</span>
        </div>
      )}
    </div>
  )
}
