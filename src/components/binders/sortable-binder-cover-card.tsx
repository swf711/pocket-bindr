'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
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
    <div ref={setNodeRef} style={style} className="group relative">
      {/* 拖拉 handle：書脊右側頂部，hover 才顯示 */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-6 z-20 flex h-5 w-5 cursor-grab items-center justify-center rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity touch-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
        aria-label={`拖拉排序：${binder.name}`}
        data-testid={`binder-drag-handle-${binder.id}`}
      >
        <GripVertical className="h-3 w-3 text-white" />
      </button>

      <BinderCoverCard binder={binder} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}
