'use client'

import { useState } from 'react'
import { Eye, EyeOff, Maximize2, Trash2 } from 'lucide-react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
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
      className={`relative group w-full aspect-5/7 overflow-hidden rounded-md border border-border bg-card cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-40' : 'opacity-100'
      } ${isOver && !isDragOverlay ? 'ring-2 ring-primary' : ''} ${
        isHighlighted ? 'ring-2 ring-primary animate-pulse' : ''
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

      {/* 操作按鈕 overlay — 三按鈕各自 counter-scale，保持自然視覺尺寸；桌面 hover 顯示，行動裝置 tap 顯示 */}
      {!isDragOverlay && (
        <div className={`absolute inset-0 transition-opacity pointer-events-none ${isTapped ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {/* 左：切換狀態 */}
          <div style={{ position: 'absolute', top: 4, left: 4, transform: `scale(${counterScale})`, transformOrigin: 'top left', pointerEvents: 'auto' }}>
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onToggleStatus(slot.id)}
              title={slot.status === 'owned' ? '切換為想要' : '切換為擁有'}
            >
              {slot.status === 'owned' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>

          {/* 中：查看（可選） */}
          {onView && (
            <div style={{ position: 'absolute', top: 4, left: '50%', transform: `translateX(-50%) scale(${counterScale})`, transformOrigin: 'top center', pointerEvents: 'auto' }}>
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onView(slot.cardId)}
                title="查看卡牌詳情"
                data-testid={`slot-view-btn-${slot.id}`}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* 右：刪除 */}
          <div style={{ position: 'absolute', top: 4, right: 4, transform: `scale(${counterScale})`, transformOrigin: 'top right', pointerEvents: 'auto' }}>
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
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
          </div>
        </div>
      )}
    </div>
  )
}
