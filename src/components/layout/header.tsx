import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/layout/user-menu'
import { MobileNav } from '@/components/layout/mobile-nav'

export async function Header() {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const username =
    session?.user?.name ?? session?.user?.email?.split('@')[0] ?? '使用者'

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <MobileNav isLoggedIn={isLoggedIn} />
          <Link href="/" className="text-lg font-bold tracking-tight">
            TCG Binder
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/cards"
              data-testid="nav-cards"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              卡片搜尋
            </Link>
            {isLoggedIn && (
              <Link
                href="/binders"
                data-testid="nav-binders"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                我的卡冊
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <UserMenu username={username} image={session?.user?.image ?? null} />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login" data-testid="nav-login">
                  登入
                </Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/register">註冊</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
