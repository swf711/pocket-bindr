'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('common')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          data-testid="user-menu-trigger"
          className='rounded-full'
        >
          <Avatar size="lg">
            {image && <AvatarImage src={image} alt={username} />}
            <AvatarFallback className='bg-tertiary-container text-on-tertiary-container'>{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 border-none bg-surface-container-low shadow/30">
        <DropdownMenuLabel className="h-12 px-3 flex items-center gap-2">
          <Avatar size="lg">
            {image && <AvatarImage src={image} alt={username} />}
            <AvatarFallback className='bg-tertiary-container text-on-tertiary-container'>{initial}</AvatarFallback>
          </Avatar>
          <span className='w-full truncate text-foreground text-base'>{username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className='mx-1' />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="rounded-md px-3 h-12 text-muted-foreground focus:bg-foreground/10 focus:text-muted-foreground cursor-pointer">
            <Settings />
            {t('settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="menu-logout"
          className="rounded-md px-3 h-12 text-muted-foreground focus:bg-foreground/10 focus:text-muted-foreground cursor-pointer"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
