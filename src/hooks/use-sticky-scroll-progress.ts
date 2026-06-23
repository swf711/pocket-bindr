'use client'

import { useEffect, useRef, useState } from 'react'

interface StickyScrollProgressResult<T extends HTMLElement> {
  outerRef: React.RefObject<T | null>
  progress: number
}

/**
 * Tracks scroll progress (0→1) through a tall outer element whose child is
 * `sticky top-0`. `outerRef` binds to the tall outer element (e.g. h-[200vh]);
 * progress reflects how far the pinned region has been scrolled.
 *
 * travel = outer.offsetHeight - viewport（釘住舞台高 ≈ window.innerHeight）
 * progress = clamp(-outerRect.top / travel, 0, 1)
 *
 * 以 getBoundingClientRect（相對 viewport）計算，並以 capture 監聽 window scroll，
 * 不論捲動發生在 window 或任何祖先捲動容器都能正確更新（本站首頁實際捲動在 window）。
 */
export function useStickyScrollProgress<
  T extends HTMLElement = HTMLElement,
>(): StickyScrollProgressResult<T> {
  const outerRef = useRef<T>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return

    let raf = 0
    const update = () => {
      raf = 0
      const travel = outer.offsetHeight - window.innerHeight
      if (travel <= 0) {
        setProgress(0)
        return
      }
      const top = outer.getBoundingClientRect().top
      setProgress(Math.min(Math.max(-top / travel, 0), 1))
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    // capture:true 讓 window 也能收到子層捲動容器的 scroll 事件（scroll 不冒泡）
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return { outerRef, progress }
}
