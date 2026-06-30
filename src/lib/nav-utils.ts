/**
 * 判斷 nav link 是否對應當前 route。
 * 首頁 '/' 採精確比對；其餘採 startsWith（子頁高亮父層，例如 /binders/123 → /binders active）。
 */
export function isActiveNavLink(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

/** nav link 對應當前 route 時套用的 active 樣式（桌面/行動版共用，避免漂移）。 */
export const NAV_ACTIVE_CLASS = 'bg-secondary-container text-on-secondary-container'
