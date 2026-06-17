'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { BinderSummary, GRID_TYPE_LABELS } from '@/types/binder'
import { GridType } from '@prisma/client'
import { BinderCoverCard } from './binder-cover-card'

interface SortableBinderCoverCardProps {
  binder: BinderSummary
  onEdit: (binder: BinderSummary) => void
  onDelete: (binder: BinderSummary) => void
}

export function SortableBinderCoverCard({ binder, onEdit, onDelete }: SortableBinderCoverCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: binder.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <HoverCard openDelay={400} closeDelay={100} open={isDragging ? false : undefined}>
      <HoverCardTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className="group relative cursor-grab active:cursor-grabbing"
          aria-label={`卡冊：${binder.name}`}
          data-testid={`binder-sortable-${binder.id}`}
        >
          <BinderCoverCard binder={binder} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-48 p-3 text-sm" side="right" align="end">
        <div className="space-y-1">
          <p className="font-semibold truncate">{binder.name}</p>
          <p className="text-muted-foreground">{GRID_TYPE_LABELS[binder.gridType as GridType]}</p>
          <p className="text-muted-foreground">{binder._count.slots} 張卡</p>
          <p className="text-muted-foreground">
            {new Date(binder.createdAt).toLocaleDateString('zh-TW')}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
