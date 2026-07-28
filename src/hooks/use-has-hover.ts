'use client'

import { useState, useEffect } from 'react'

/**
 * 偵測裝置是否「無 hover 能力」（觸控裝置，如 iPad / 手機）。
 * iPad 寬度 ≥ 768px 被 useIsMobile 判為桌面、走純 hover 顯示的 spread view，
 * 但觸控裝置無真 hover，需改以 tap 顯示操作按鈕——用 `(hover: none)` 精準判斷。
 * SSR 初值 false（伺服器端當作有 hover），掛載後校正，避免 hydration 前閃動。
 */
export function useHasNoHover() {
  const [noHover, setNoHover] = useState(false)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(hover: none)')
    const onChange = () => setNoHover(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return noHover
}
