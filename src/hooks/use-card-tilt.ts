'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface UseCardTiltOptions {
  maxRotateDeg?: number
  transitionMs?: number
  disabled?: boolean
}

interface TiltState {
  rotateX: number
  rotateY: number
  shineX: number
  shineY: number
  active: boolean
}

export interface UseCardTiltResult {
  containerRef: React.RefObject<HTMLDivElement | null>
  transformerStyle: React.CSSProperties
  shineStyle: React.CSSProperties
  handlers: {
    onPointerMove: (e: React.PointerEvent) => void
    onPointerLeave: () => void
    onPointerCancel: () => void
  }
}

const INITIAL_STATE: TiltState = { rotateX: 0, rotateY: 0, shineX: 0.5, shineY: 0.5, active: false }

export function useCardTilt({
  maxRotateDeg = 15,
  transitionMs = 150,
  disabled = false,
}: UseCardTiltOptions = {}): UseCardTiltResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [tilt, setTilt] = useState<TiltState>(INITIAL_STATE)

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return
      const el = containerRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const rx = (e.clientX - rect.left) / rect.width
      const ry = (e.clientY - rect.top) / rect.height

      const rotateY = (rx - 0.5) * 2 * maxRotateDeg
      const rotateX = -(ry - 0.5) * 2 * maxRotateDeg

      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setTilt({ rotateX, rotateY, shineX: rx, shineY: ry, active: true })
        rafRef.current = null
      })
    },
    [disabled, maxRotateDeg],
  )

  const reset = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setTilt(INITIAL_STATE)
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const transformerStyle: React.CSSProperties = tilt.active
    ? {
        transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: `transform ${transitionMs}ms ease-out`,
        willChange: 'transform',
        borderRadius: 'inherit',
        overflow: 'hidden',
      }
    : {
        transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
        transition: 'transform 300ms ease-out',
        borderRadius: 'inherit',
        overflow: 'hidden',
      }

  const shineStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
    mixBlendMode: 'overlay',
    background: `radial-gradient(circle at ${tilt.shineX * 100}% ${tilt.shineY * 100}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 60%)`,
    opacity: tilt.active ? 1 : 0,
    transition: `opacity ${tilt.active ? transitionMs : 300}ms ease-out`,
  }

  return {
    containerRef,
    transformerStyle,
    shineStyle,
    handlers: { onPointerMove: handlePointerMove, onPointerLeave: reset, onPointerCancel: reset },
  }
}
