'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { IconTooltipButton } from '@/components/common/icon-tooltip-button'

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <IconTooltipButton
      variant="outline"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      tooltip="切換主題"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">切換主題</span>
    </IconTooltipButton>
  )
}
