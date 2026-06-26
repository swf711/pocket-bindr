'use client'

import Link from 'next/link'
import { Menu, Home, Search, BookOpen, Library, Settings, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
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

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            data-testid="mobile-nav-trigger"
            aria-label="開啟選單"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64">
          <SheetHeader>
            <SheetTitle>選單</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1">
            <SheetClose asChild>
              <Link
                href="/"
                data-testid="mobile-nav-home"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Home className="size-4" />
                首頁
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/cards"
                data-testid="mobile-nav-cards"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Search className="size-4" />
                卡牌搜尋
              </Link>
            </SheetClose>
            {isLoggedIn && (
              <SheetClose asChild>
                <Link
                  href="/binders"
                  data-testid="mobile-nav-binders"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <BookOpen className="size-4" />
                  我的卡冊
                </Link>
              </SheetClose>
            )}
            {isLoggedIn && (
              <SheetClose asChild>
                <Link
                  href="/collection"
                  data-testid="mobile-nav-collection"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Library className="size-4" />
                  我的收藏
                </Link>
              </SheetClose>
            )}
          </nav>

          <Separator />

          {isLoggedIn ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar className="size-7">
                  {image && <AvatarImage src={image} alt={username} />}
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <span className="max-w-36 truncate text-sm font-medium">
                  {username}
                </span>
              </div>
              <SheetClose asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Settings className="size-4" />
                  設定
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <button
                  data-testid="menu-logout"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <LogOut className="size-4" />
                  登出
                </button>
              </SheetClose>
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-3">
              <SheetClose asChild>
                <Button variant="ghost" asChild className="w-full justify-start">
                  <Link href="/login">登入</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="default" asChild className="w-full">
                  <Link href="/register">註冊</Link>
                </Button>
              </SheetClose>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
