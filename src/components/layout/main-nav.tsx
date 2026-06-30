'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { isActiveNavLink, NAV_ACTIVE_CLASS } from '@/lib/nav-utils'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { PendingLink } from '@/components/layout/pending-link'

interface MainNavProps {
  isLoggedIn: boolean
}

export function MainNav({ isLoggedIn }: MainNavProps) {
  const pathname = usePathname()

  return (
    <nav className="hidden items-center gap-2 md:flex">
      {NAV_ITEMS.filter((item) => !item.requiresAuth || isLoggedIn).map((item) => {
        const active = isActiveNavLink(pathname, item.href)
        const Icon = item.icon
        return (
          <PendingLink
            key={item.href}
            href={item.href}
            data-testid={item.testId}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1 rounded-3xl px-4 py-2.5 text-sm font-medium transition-colors',
              active
                ? NAV_ACTIVE_CLASS
                : 'text-muted-foreground hover:bg-surface-container-highest'
            )}
          >
            <Icon className="size-4" fill={active ? 'currentColor' : 'none'} />
            {item.label}
          </PendingLink>
        )
      })}
    </nav>
  )
}
