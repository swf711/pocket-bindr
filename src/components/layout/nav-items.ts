import { Home, Search, BookOpen, Library, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  /** 桌面導航 data-testid；行動版以 `mobile-${testId}` 衍生 */
  testId: string
  icon: LucideIcon
  requiresAuth: boolean
}

/** 主導航項目（桌面 MainNav 與行動 MobileNav 共用，單一來源避免漂移） */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '首頁', testId: 'nav-home', icon: Home, requiresAuth: false },
  { href: '/cards', label: '卡牌搜尋', testId: 'nav-cards', icon: Search, requiresAuth: false },
  { href: '/binders', label: '我的卡冊', testId: 'nav-binders', icon: BookOpen, requiresAuth: true },
  { href: '/collection', label: '我的收藏', testId: 'nav-collection', icon: Library, requiresAuth: true },
]
