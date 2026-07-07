'use client'

import { usePathname } from 'next/navigation'
import { FooterContent } from '@/components/layout/footer-content'

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
      <FooterContent />
    </footer>
  )
}
