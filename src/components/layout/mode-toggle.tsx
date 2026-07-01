'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { IconTooltipButton } from '@/components/common/icon-tooltip-button'

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations('theme')

  return (
    <IconTooltipButton
      variant="ghost"
      size="icon-lg"
      className="rounded-3xl bg-transparent text-muted-foreground hover:bg-surface-container-highest dark:hover:bg-surface-container-highest hover:text-muted-foreground"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      tooltip={t('toggle')}
    >
      <Sun className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">{t('toggle')}</span>
    </IconTooltipButton>
  )
}
