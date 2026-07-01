'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function Footer() {
  const pathname = usePathname()
  const t = useTranslations('footer')

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
          {t('rights')}
        </p>
        <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
          {t('disclaimer')}
        </p>
      </div>
    </footer>
  )
}
