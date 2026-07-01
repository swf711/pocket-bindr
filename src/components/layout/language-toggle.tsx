'use client'

import { Globe, Check } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconTooltipButton } from '@/components/common/icon-tooltip-button'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/locale'
import { setLocale } from '@/i18n/locale-actions'
import { cn } from '@/lib/utils'

export function LanguageToggle() {
  const t = useTranslations('language')
  const activeLocale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSelect = (locale: Locale) => {
    if (locale === activeLocale) return
    startTransition(async () => {
      await setLocale(locale)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconTooltipButton
          variant="ghost"
          size="icon-lg"
          disabled={isPending}
          className="rounded-3xl bg-transparent text-muted-foreground hover:bg-surface-container-highest dark:hover:bg-surface-container-highest hover:text-muted-foreground"
          tooltip={t('toggle')}
        >
          <Globe className="size-5" />
          <span className="sr-only">{t('toggle')}</span>
        </IconTooltipButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 border-none bg-surface-container-low shadow/30">
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleSelect(locale)}
            className="rounded-md px-3 h-10 text-muted-foreground focus:bg-foreground/10 focus:text-muted-foreground cursor-pointer"
          >
            <Check
              className={cn('size-4', locale === activeLocale ? 'opacity-100' : 'opacity-0')}
            />
            {LOCALE_LABELS[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
