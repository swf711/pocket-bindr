'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LogOut, Settings } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  username: string
  image?: string | null
}

export function UserMenu({ username, image }: UserMenuProps) {
  const initial = username.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          data-testid="user-menu-trigger"
          className="flex items-center gap-2 px-2"
        >
          <Avatar className="size-7">
            {image && <AvatarImage src={image} alt={username} />}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="max-w-32 truncate text-sm font-medium">
            {username}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">{username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" />
            設定
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-testid="menu-logout"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="size-4" />
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
