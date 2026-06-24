'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Move } from 'lucide-react'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import type { ShowcaseCard } from '@/types/homepage'

const HERO_PARALLAX_FACTOR = 0.3

// Tilt is rotation-only; position is handled by layout margin (see hero-section.tsx).
// Flat state removes only the rotations — no translate means no position jump on press.
const IDLE_TILT = 'rotateX(5deg) rotateY(-15deg) rotateZ(10deg)'
const FLAT_TILT = 'none'

interface SortableCardProps {
  card: ShowcaseCard
  index: number
}

function SortableCard({ card, index }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  // No DragOverlay: the binder is flattened during drag, so the item itself moves
  // in flat screen space and tracks the cursor. Lift styles are composed into the
  // inline transform (Tailwind transform utilities would be overridden by it).
  const base = CSS.Transform.toString(transform)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: isDragging ? `${base ?? ''} scale(1.08) rotate(3deg)` : base,
        transition,
        position: 'relative',
        zIndex: isDragging ? 50 : undefined,
      }}
      {...attributes}
      {...listeners}
      className={`aspect-5/7 rounded-md overflow-hidden cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'shadow-2xl' : 'shadow-md'
      }`}
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
  // Flatten on pointer-down (before dnd-kit's activation/measurement) so the grid
  // rects are measured in flat screen space — this keeps both collision detection
  // and the sortable shift transforms accurate. See docs/PATTERNS.md.
  const [pressed, setPressed] = useState(false)
  // Tilt only on lg+ screens; default false so SSR/mobile hydrates without tilt.
  const [isDesktop, setIsDesktop] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const parallaxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Parallax: binder scrolls faster than page (exits at 1.3×) — desktop + no reduced-motion only.
  // Direct DOM mutation via rAF; same pattern as StatsCarouselSection sticky parallax.
  useEffect(() => {
    if (!isDesktop || reducedMotion) return
    const el = parallaxRef.current
    if (!el) return

    let raf = 0
    const update = () => {
      raf = 0
      el.style.transform = `translateY(${-window.scrollY * HERO_PARALLAX_FACTOR}px)`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [isDesktop, reducedMotion])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Restore the tilt when the press ends without (or after) a drag.
  useEffect(() => {
    if (!pressed) return
    const clear = () => setPressed(false)
    window.addEventListener('pointerup', clear)
    window.addEventListener('pointercancel', clear)
    return () => {
      window.removeEventListener('pointerup', clear)
      window.removeEventListener('pointercancel', clear)
    }
  }, [pressed])

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    setPressed(false)
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((c) => c.id === active.id)
    const newIndex = items.findIndex((c) => c.id === over.id)
    setItems(arrayMove(items, oldIndex, newIndex))
  }

  // flat = while pressed (instant) or dragging; tilt back smoothly on release.
  const flat = pressed || activeId !== null

  return (
    <div ref={parallaxRef} style={{ willChange: 'transform' }}>
    <div style={{ perspective: '1200px' }}>
      <div
        style={{
          // Flatten while interacting so dnd-kit's collision/sort math is accurate;
          // instant flatten-in (no transition), smooth tilt-back on release.
          // FLAT_TILT keeps the same translate so the binder doesn't jump on press.
          transform: !isDesktop || flat ? FLAT_TILT : IDLE_TILT,
          transformOrigin: 'center center',
          transition: flat ? 'none' : 'transform 0.25s ease',
        }}
      >
        <div className="flex justify-center items-center gap-1 text-muted-foreground mb-3">
          <span>拖拉卡牌來重新排列</span>
          <Move className="size-4" />
        </div>

        <div
          style={{ touchAction: 'none' }}
          className="dark relative bg-black/80 border-2 border-muted rounded-xl p-3 shadow-inner"
          data-testid="hero-binder"
          onPointerDown={() => setPressed(true)}
        >
          {/* Binder spine decoration */}
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-muted/60 rounded-l-xl border-r border-muted" />
          <div className="pl-3">
            <DndContext
              id="hero-binder-dnd"
              sensors={sensors}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={items.map((c) => c.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 gap-2">
                  {items.map((card, i) => (
                    <SortableCard key={card.id} card={card} index={i} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
