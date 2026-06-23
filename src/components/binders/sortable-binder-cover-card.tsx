'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BinderSummary } from '@/types/binder'
import { BinderCoverCard } from './binder-cover-card'

interface SortableBinderCoverCardProps {
  binder: BinderSummary
  onEdit: (binder: BinderSummary) => void
  onDelete: (binder: BinderSummary) => void
  onShare: (binder: BinderSummary) => void
  isTapped?: boolean
  onTap?: () => void
}

export function SortableBinderCoverCard({ binder, onEdit, onDelete, onShare, isTapped, onTap }: SortableBinderCoverCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: binder.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    // touch-action: none 讓 TouchSensor 可從整張卡任意位置啟動；binder 列表最多 3 本，
    // 頁面幾乎不需要在卡片區 scroll，此設定的 scroll 限制可接受
    touchAction: 'none' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={!isDragging && onTap ? (e) => { e.stopPropagation(); onTap() } : undefined}
      className="relative cursor-grab active:cursor-grabbing select-none"
      aria-label={`卡冊：${binder.name}`}
      data-testid={`binder-sortable-${binder.id}`}
    >
      <BinderCoverCard
        binder={binder}
        onEdit={onEdit}
        onDelete={onDelete}
        onShare={onShare}
        isTapped={isTapped}
      />
    </div>
  )
}
