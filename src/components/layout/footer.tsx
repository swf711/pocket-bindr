'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()

  const HIDDEN_PATHS = ['/login', '/register', '/']
  if (
    (pathname.startsWith('/binders/') && pathname !== '/binders') ||
    HIDDEN_PATHS.includes(pathname)
  ) {
    return null
  }

  return (
    <footer className="border-t py-6 mt-auto" data-testid="site-footer">
      <div className="container mx-auto px-4 text-center space-y-2">
        <Image
          src="/logo-light.svg"
          alt='logo'
          width={150}
            height={100}
          className="light:block dark:hidden mx-auto"
        />
        <Image
          src="/logo-dark.svg"
          alt='logo'
          width={150}
            height={100}
          className="dark:block hidden mx-auto"
        />
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
