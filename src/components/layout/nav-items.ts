import { Home, Search, BookOpen, Library, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  /** i18n key under the `nav` namespace（label 由元件以 useTranslations('nav') 解析） */
  labelKey: string
  /** 桌面導航 data-testid；行動版以 `mobile-${testId}` 衍生 */
  testId: string
  icon: LucideIcon
  requiresAuth: boolean
}

/** 主導航項目（桌面 MainNav 與行動 MobileNav 共用，單一來源避免漂移） */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'home', testId: 'nav-home', icon: Home, requiresAuth: false },
  { href: '/cards', labelKey: 'cards', testId: 'nav-cards', icon: Search, requiresAuth: false },
  { href: '/binders', labelKey: 'binders', testId: 'nav-binders', icon: BookOpen, requiresAuth: true },
  { href: '/collection', labelKey: 'collection', testId: 'nav-collection', icon: Library, requiresAuth: true },
]
