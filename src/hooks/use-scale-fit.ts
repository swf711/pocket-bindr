'use client'

import { useLayoutEffect, useRef, useState } from 'react'

interface ScaleFitResult {
  outerRef: React.RefObject<HTMLDivElement | null>
  innerRef: React.RefObject<HTMLDivElement | null>
  scale: number
  offsetX: number
  offsetY: number
  innerH: number
}

export function computeScaleFit(
  outerW: number,
  outerH: number,
  naturalWidth: number,
  innerH: number,
): { scale: number; offsetX: number; offsetY: number } {
  const scale = Math.min(outerW / naturalWidth, outerH / innerH, 1)
  const offsetX = Math.max(0, (outerW - naturalWidth * scale) / 2)
  const offsetY = Math.max(0, (outerH - innerH * scale) / 2)
  return { scale, offsetX, offsetY }
}

/**
 * Snowglobe scale-to-fit: renders inner content at naturalWidth, then CSS-scales
 * it uniformly to fit the outer container. Never upscales (max scale = 1).
 */
export function useScaleFit(naturalWidth: number): ScaleFitResult {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({ scale: 1, offsetX: 0, offsetY: 0, innerH: 0 })

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    const update = () => {
      const outerW = outer.clientWidth
      const outerH = outer.clientHeight
      const innerH = inner.offsetHeight // layout height — unaffected by CSS scale transform
      if (innerH === 0 || outerW === 0) return
      setState({ ...computeScaleFit(outerW, outerH, naturalWidth, innerH), innerH })
    }

    const outerObs = new ResizeObserver(update)
    const innerObs = new ResizeObserver(update)
    outerObs.observe(outer)
    innerObs.observe(inner)
    update()

    return () => {
      outerObs.disconnect()
      innerObs.disconnect()
    }
  }, [naturalWidth])

  return { outerRef, innerRef, ...state }
}
