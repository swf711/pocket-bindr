'use client'

import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()

  if (pathname.startsWith('/binders/') && pathname !== '/binders') {
    return null
  }

  return (
    <footer className="border-t py-6 mt-auto" data-testid="site-footer">
      <div className="container mx-auto px-4 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          © 2026 TCG Binder, All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
          本站與 Nintendo、The Pokémon Company、Bandai 及相關商標持有人無任何關聯。
          卡牌圖片版權歸原版權方所有，僅供收藏整理參考用途。
        </p>
      </div>
    </footer>
  )
}
