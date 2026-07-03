'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookCheck, Bookmark, Copy, Eye, Trash2 } from 'lucide-react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import type { SlotWithCard } from '@/types/binder'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface SlotCardProps {
  slot: SlotWithCard
  onDelete: (slotId: string) => void
  onToggleStatus: (slotId: string) => void
  onView?: (cardId: string) => void
  onCopy?: (slotId: string) => void
  isDragOverlay?: boolean
  isHighlighted?: boolean
  counterScale?: number
  isTapped?: boolean
  onTap?: () => void
}

export function SlotCard({
  slot,
  onDelete,
  onToggleStatus,
  onView,
  onCopy,
  isDragOverlay = false,
  isHighlighted = false,
  counterScale = 1,
  isTapped = false,
  onTap,
}: SlotCardProps) {
  const t = useTranslations('binder.slotCard')
  const [open, setOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: `slot-${slot.id}`, disabled: isDragOverlay })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${slot.id}`,
    disabled: isDragOverlay,
  })

  const imageUrl = getCardImageUrl(slot.card.imageSmall)

  return (
    <div
      ref={(node) => {
        setDragRef(node)
        setDropRef(node)
      }}
      {...attributes}
      {...listeners}
      data-testid={isDragOverlay ? 'drag-overlay-card' : `slot-card-${slot.id}`}
      onClick={!isDragOverlay && onTap ? (e) => { e.stopPropagation(); onTap() } : undefined}
      style={{ touchAction: 'none' }}
      className={`relative group w-full aspect-5/7 overflow-hidden rounded-md border border-border bg-card cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'
        } ${isOver && !isDragOverlay ? 'ring-2 ring-primary' : ''} ${isHighlighted ? 'ring-2 ring-primary animate-pulse' : ''
        }`}
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

      {/* 操作按鈕 overlay — ButtonGroup 底部中央，counter-scale 保持自然視覺尺寸；桌面 hover 顯示，行動裝置 tap 顯示 */}
      {!isDragOverlay && (
        <div className={`absolute inset-0 flex items-end justify-center pb-2 transition-opacity pointer-events-none ${isTapped ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div
            style={{ transform: `scale(${counterScale})`, transformOrigin: 'bottom center' }}
            className={isTapped ? 'pointer-events-auto' : 'pointer-events-none group-hover:pointer-events-auto'}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <ButtonGroup>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon-sm"
                    onClick={() => onToggleStatus(slot.id)}
                    aria-label={slot.status === 'owned' ? t('switchToWanted') : t('switchToOwned')}
                  >
                    {slot.status === 'owned' ? <Bookmark /> : <BookCheck />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{slot.status === 'owned' ? t('switchToWanted') : t('switchToOwned')}</p>
                </TooltipContent>
              </Tooltip>
              {onCopy && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon-sm"
                      onClick={() => onCopy(slot.id)}
                      data-testid={`slot-copy-btn-${slot.id}`}
                      aria-label={t('copyToEmptySlot')}
                    >
                      <Copy />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('copyToEmptySlot')}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {onView && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon-sm"
                      onClick={() => onView(slot.cardId)}
                      data-testid={`slot-view-btn-${slot.id}`}
                      aria-label={t('viewCard')}
                    >
                      <Eye />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('viewCard')}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <AlertDialog open={open} onOpenChange={setOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="default"
                        size="icon-sm"
                        data-variant="destructive"
                        aria-label={t('removeCard')}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/50"
                      >
                        <Trash2 />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('removeCard')}</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('removeCard')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('removeCardConfirm', { cardName: slot.card.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(slot.id)}>{t('confirmRemove')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </ButtonGroup>
          </div>
        </div>
      )}
    </div>
  )
}
