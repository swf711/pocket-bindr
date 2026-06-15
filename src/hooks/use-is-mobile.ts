'use client'

import * as React from 'react'

const MOBILE_BREAKPOINT = 768

/** 視窗寬度 < 768px 視為行動裝置；SSR 期間回傳 false */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    onChange()
    if (typeof window.matchMedia !== 'function') {
      window.addEventListener('resize', onChange)
      return () => window.removeEventListener('resize', onChange)
    }
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
