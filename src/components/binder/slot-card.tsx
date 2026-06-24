'use client'

import { useState } from 'react'
import { BookCheck, Bookmark, Eye, Trash2 } from 'lucide-react'
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
  isDragOverlay = false,
  isHighlighted = false,
  counterScale = 1,
  isTapped = false,
  onTap,
}: SlotCardProps) {
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
                    variant="secondary"
                    size="icon-sm"
                    onClick={() => onToggleStatus(slot.id)}
                    aria-label={slot.status === 'owned' ? '切換為想要' : '切換為擁有'}
                  >
                    {slot.status === 'owned' ? <Bookmark /> : <BookCheck />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{slot.status === 'owned' ? '切換為想要' : '切換為擁有'}</p>
                </TooltipContent>
              </Tooltip>
              {onView && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      onClick={() => onView(slot.cardId)}
                      data-testid={`slot-view-btn-${slot.id}`}
                      aria-label="查看卡牌"
                    >
                      <Eye />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>查看卡牌</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <AlertDialog open={open} onOpenChange={setOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button variant="secondary" size="icon-sm" data-variant="destructive" aria-label="移除卡牌">
                        <Trash2 className="text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>移除卡牌</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>移除卡牌</AlertDialogTitle>
                    <AlertDialogDescription>
                      確定要從卡冊移除 {slot.card.name} 嗎？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(slot.id)}>確認移除</AlertDialogAction>
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
