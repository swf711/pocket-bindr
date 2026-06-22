'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ShowcaseCard } from '@/types/homepage'

interface SortableCardProps {
  card: ShowcaseCard
  index: number
}

function SortableCard({ card, index }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      {...attributes}
      {...listeners}
      className="aspect-[2/3] rounded-md overflow-hidden shadow-md cursor-grab active:cursor-grabbing select-none"
      data-testid={`hero-binder-card-${index}`}
    >
      <img
        src={card.imageSmall}
        alt={card.zhName ?? card.name}
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  )
}

interface HeroBinderProps {
  cards: ShowcaseCard[]
}

export function HeroBinder({ cards }: HeroBinderProps) {
  const [items, setItems] = useState(cards)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((c) => c.id === active.id)
    const newIndex = items.findIndex((c) => c.id === over.id)
    setItems(arrayMove(items, oldIndex, newIndex))
  }

  const activeCard = activeId ? items.find((c) => c.id === activeId) : null

  return (
    <div
      style={{ touchAction: 'none' }}
      className="relative bg-muted/30 border-2 border-muted rounded-xl p-3 shadow-inner"
      data-testid="hero-binder"
    >
      {/* Binder spine decoration */}
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-muted/60 rounded-l-xl border-r border-muted" />
      <div className="pl-3">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2">
              {items.map((card, i) => (
                <SortableCard key={card.id} card={card} index={i} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeCard && (
              <div className="aspect-[2/3] rounded-md overflow-hidden shadow-2xl rotate-3 scale-110">
                <img
                  src={activeCard.imageSmall}
                  alt={activeCard.zhName ?? activeCard.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
