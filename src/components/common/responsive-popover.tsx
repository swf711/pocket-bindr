'use client'

import * as React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { cn } from '@/lib/utils'

interface ResponsivePopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactNode
  /** Drawer a11y 必要標題（視覺隱藏，供螢幕閱讀器） */
  title: string
  children: React.ReactNode
  align?: React.ComponentProps<typeof PopoverContent>['align']
  side?: React.ComponentProps<typeof PopoverContent>['side']
  popoverClassName?: string
  drawerClassName?: string
}

/** 行動裝置改用底部 Drawer（vaul 會在輸入框聚焦時自動避開軟鍵盤），桌面維持 Popover */
export function ResponsivePopover({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  align,
  side,
  popoverClassName,
  drawerClassName,
}: ResponsivePopoverProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className={drawerClassName}>
          <DrawerHeader className="sr-only">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          {children}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        className={cn(popoverClassName)}
        onWheel={(e) => e.stopPropagation()}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
