import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/layout/user-menu'
import { MobileNav } from '@/components/layout/mobile-nav'
import { MainNav } from '@/components/layout/main-nav'
import { ModeToggle } from './mode-toggle'
import Image from 'next/image'

export async function Header() {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const username =
    session?.user?.name ?? session?.user?.email?.split('@')[0] ?? '使用者'

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
          <ModeToggle />
          <div className="hidden md:flex md:items-center md:gap-2">
            {isLoggedIn ? (
              <UserMenu username={username} image={session?.user?.image ?? null} />
            ) : (
              <Button variant="default" className="h-10 rounded-3xl" asChild>
                <Link href="/login" data-testid="nav-login">
                  登入
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
