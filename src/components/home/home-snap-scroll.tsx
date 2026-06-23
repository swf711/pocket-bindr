'use client'

import { useEffect } from 'react'

/**
 * 首頁專用：把 snap scroll 套到真正的捲動容器（<html> / window）。
 * 首頁的實際捲動發生在 window（body 為 min-h-full 隨內容撐高），
 * 因此 snap-type 必須掛在 documentElement，而非內層 div。掛載期間加 class，
 * 卸載（離開首頁）時移除，避免影響其他頁面。樣式見 globals.css `html.home-snap-scroll`。
 */
export function HomeSnapScroll() {
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('home-snap-scroll')
    return () => html.classList.remove('home-snap-scroll')
  }, [])
  return null
}
