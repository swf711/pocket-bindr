'use client'

import { useRef, useCallback } from 'react'
import type { DragMoveEvent } from '@dnd-kit/core'

interface UseEdgeHoverPageFlipOptions {
  containerRef: React.RefObject<HTMLElement | null>
  spreadIndex: number
  totalSpreads: number
  onSpreadChange: (index: number) => void
  edgeWidth?: number   // px from edge that triggers flip zone
  holdDuration?: number // ms pointer must stay in zone before flip
}

/**
 * Monitors pointer position during dnd-kit drag and flips the spread when
 * the pointer hovers near the left/right edge of the container for holdDuration ms.
 * Only desktop — mobile drag is not supported (see BDD pending items).
 */
export function useEdgeHoverPageFlip({
  containerRef,
  spreadIndex,
  totalSpreads,
  onSpreadChange,
  edgeWidth = 40,
  holdDuration = 600,
}: UseEdgeHoverPageFlipOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastZoneRef = useRef<'left' | 'right' | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const container = containerRef.current
      if (!container) return

      // Current pointer position = drag start position + accumulated delta
      const nativeEvent = event.activatorEvent as PointerEvent | null
      if (!nativeEvent) return

      const currentX = nativeEvent.clientX + event.delta.x
      const rect = container.getBoundingClientRect()
      const relX = currentX - rect.left

      let zone: 'left' | 'right' | null = null
      if (relX <= edgeWidth && spreadIndex > 0) zone = 'left'
      else if (relX >= rect.width - edgeWidth && spreadIndex < totalSpreads - 1) zone = 'right'

      if (zone !== lastZoneRef.current) {
        clearTimer()
        lastZoneRef.current = zone
        if (zone !== null) {
          timerRef.current = setTimeout(() => {
            if (zone === 'left') onSpreadChange(spreadIndex - 1)
            else if (zone === 'right') onSpreadChange(spreadIndex + 1)
            lastZoneRef.current = null
          }, holdDuration)
        }
      }
    },
    [containerRef, spreadIndex, totalSpreads, onSpreadChange, edgeWidth, holdDuration, clearTimer],
  )

  const handleDragEnd = useCallback(() => {
    clearTimer()
    lastZoneRef.current = null
  }, [clearTimer])

  return { handleDragMove, handleDragEnd }
}
