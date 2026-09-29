import { Home, Search, BookOpen, Library, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  /** i18n key under the `nav` namespace（label 由元件以 useTranslations('nav') 解析） */
  labelKey: string
  /** 桌面導航 data-testid；行動版以 `mobile-${testId}` 衍生 */
  testId: string
  icon: LucideIcon
  requiresAuth: boolean
  /**
   * 傳給 next/link 的 prefetch prop；未指定則沿用 Link 預設（true，viewport 內自動預抓）。
   * 首頁（`/`）設為 false：header 全站常駐、必定在 viewport 內，該連結自 ISR 化（perf/
   * homepage-isr-and-cache）後每次自動預抓會對同一頁面各段觸發多個 segment prefetch 請求
   * （2026-09-29 實測：4～5 個並行請求），非本專案熱點頁、CDN 已快取，預抓價值低。
   */
  prefetch?: boolean
}

/** 主導航項目（桌面 MainNav 與行動 MobileNav 共用，單一來源避免漂移） */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'home', testId: 'nav-home', icon: Home, requiresAuth: false, prefetch: false },
  { href: '/cards', labelKey: 'cards', testId: 'nav-cards', icon: Search, requiresAuth: false },
  { href: '/binders', labelKey: 'binders', testId: 'nav-binders', icon: BookOpen, requiresAuth: true },
  { href: '/collection', labelKey: 'collection', testId: 'nav-collection', icon: Library, requiresAuth: true },
]
