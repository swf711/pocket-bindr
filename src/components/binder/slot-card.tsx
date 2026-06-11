'use client'

import { useState } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
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
  isDragOverlay?: boolean
}

export function SlotCard({ slot, onDelete, onToggleStatus, isDragOverlay = false }: SlotCardProps) {
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
      className={`relative group aspect-[5/7] w-full overflow-hidden rounded-md border border-border bg-card cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-40' : 'opacity-100'
      } ${isOver && !isDragOverlay ? 'ring-2 ring-primary' : ''}`}
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

      {!isDragOverlay && (
        <div className="absolute inset-0 flex items-start justify-between p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Button
            variant="secondary"
            size="icon"
            className="h-6 w-6 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onToggleStatus(slot.id)}
            title={slot.status === 'owned' ? '切換為想要' : '切換為擁有'}
          >
            {slot.status === 'owned' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-6 w-6 pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>移除卡片</AlertDialogTitle>
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
      )}
    </div>
  )
}
