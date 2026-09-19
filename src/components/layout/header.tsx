'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserMenu } from '@/components/layout/user-menu'
import { MobileNav } from '@/components/layout/mobile-nav'
import { MainNav } from '@/components/layout/main-nav'
import { ModeToggle } from './mode-toggle'
import { LanguageToggle } from './language-toggle'
import Image from 'next/image'

// Client component on purpose: calling auth() on the server would make every route
// dynamic (it reads cookies), defeating static rendering / ISR of public pages.
// Cost: logged-in users trigger one /api/auth/session fetch per full page load.
export function Header() {
  const t = useTranslations('common')
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'
  const isLoggedIn = !!session?.user
  const username =
    session?.user?.name ?? session?.user?.email?.split('@')[0] ?? t('defaultUsername')

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-50 w-full bg-surface-container backdrop-blur supports-backdrop-filter:bg-surface-container/90"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Image
              src="/logo-light-sm.svg"
              alt='logo'
              width={40}
              height={40}
              className="light:block dark:hidden"
            />
            <Image
              src="/logo-dark-sm.svg"
              alt='logo'
              width={40}
              height={40}
              className="dark:block hidden"
            />
          </Link>
          <MainNav isLoggedIn={isLoggedIn} />
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ModeToggle />
          <div className="hidden md:flex md:items-center md:gap-2">
            {isLoading ? (
              // Placeholder while the session resolves, so the header does not flash
              // "logged out" before switching to the user menu.
              <Skeleton data-testid="nav-session-loading" className="size-9 rounded-full" />
            ) : isLoggedIn ? (
              <UserMenu username={username} image={session?.user?.image ?? null} />
            ) : (
              <Button variant="default" size="lg" asChild>
                <Link href="/login" data-testid="nav-login">
                  {t('login')}
                </Link>
              </Button>
            )}
          </div>
          <MobileNav
            isLoggedIn={isLoggedIn}
            username={username}
            image={session?.user?.image ?? null}
          />
        </div>
      </div>
    </header>
  )
}
