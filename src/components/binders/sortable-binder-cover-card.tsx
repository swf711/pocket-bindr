'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BinderSummary } from '@/types/binder'
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
  )
}
