'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Menu, Settings, LogOut, X } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { isActiveNavLink, NAV_ACTIVE_CLASS } from '@/lib/nav-utils'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface MobileNavProps {
  isLoggedIn: boolean
  username: string
  image?: string | null
}

export function MobileNav({ isLoggedIn, username, image }: MobileNavProps) {
  const initial = username.charAt(0).toUpperCase()
  const pathname = usePathname()
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')

  const navLinkClass = (href: string) =>
    cn(
      'flex items-center gap-3 rounded-3xl p-4 text-sm font-medium transition-colors',
      isActiveNavLink(pathname, href)
        ? NAV_ACTIVE_CLASS
        : 'text-muted-foreground hover:bg-surface-container-highest'
    )
  const navAriaCurrent = (href: string) =>
    isActiveNavLink(pathname, href) ? ('page' as const) : undefined
  const navIconFill = (href: string) =>
    isActiveNavLink(pathname, href) ? 'currentColor' : 'none'

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            data-testid="mobile-nav-trigger"
            aria-label={t('openMenu')}
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" showCloseButton={false} className="w-64 gap-0 bg-surface-container-low rounded-2xl">
          <SheetHeader className='p-0'>
            <SheetTitle></SheetTitle>
          </SheetHeader>

          <div className='px-7 flex justify-between items-center'>
            <div className="text-muted-foreground text-sm py-4">
              {t('menu')}
            </div>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-xs"
              >
                <X className="size-5" />
              </Button>
            </SheetClose>
          </div>

          <nav className="flex flex-col px-3">
            {NAV_ITEMS.filter((item) => !item.requiresAuth || isLoggedIn).map((item) => {
              const Icon = item.icon
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    data-testid={`mobile-${item.testId}`}
                    aria-current={navAriaCurrent(item.href)}
                    className={navLinkClass(item.href)}
                  >
                    <Icon className="size-6" fill={navIconFill(item.href)} />
                    {t(item.labelKey)}
                  </Link>
                </SheetClose>
              )
            })}
          </nav>

          <div className='px-7'>
            <Separator />
            <div className="text-muted-foreground text-sm py-4">
              {t('userSection')}
            </div>
          </div>

          {isLoggedIn ? (
            <div className="flex flex-col px-3">
              <div className="flex items-center gap-3 p-4">
                <Avatar size="lg">
                  {image && <AvatarImage src={image} alt={username} />}
                  <AvatarFallback className='bg-tertiary-container text-on-tertiary-container'>{initial}</AvatarFallback>
                </Avatar>
                <span className="max-w-36 truncate text-sm font-medium">
                  {username}
                </span>
              </div>
              <SheetClose asChild>
                <Link
                  href="/settings"
                  aria-current={navAriaCurrent('/settings')}
                  className={navLinkClass('/settings')}
                >
                  <Settings className="size-6" fill={navIconFill('/settings')} />
                  {tCommon('settings')}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <button
                  data-testid="menu-logout"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex w-full items-center gap-3 rounded-3xl p-4 text-sm font-medium transition-colors text-muted-foreground hover:bg-surface-container-highest"
                >
                  <LogOut className="size-6" />
                  {tCommon('logout')}
                </button>
              </SheetClose>
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-3">
              <SheetClose asChild>
                <Button variant="default" size="lg" asChild className="w-full h-14 rounded-full">
                  <Link href="/login">{tCommon('login')}</Link>
                </Button>
              </SheetClose>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
