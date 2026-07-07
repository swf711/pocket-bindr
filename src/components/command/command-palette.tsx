'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useLocale, useTranslations } from 'next-intl'
import { Settings, Sun, Moon, Globe, Plus, Flag } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/locale'
import { setLocale } from '@/i18n/locale-actions'
import { ReportDialog } from '@/components/report/report-dialog'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const activeLocale = useLocale()
  const t = useTranslations('command')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const tReport = useTranslations('report')

  const isLoggedIn = !!session?.user

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key?.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function runCommand(action: () => void) {
    setOpen(false)
    action()
  }

  const navItems = NAV_ITEMS.filter((item) => !item.requiresAuth || isLoggedIn)

  return (
    <>
    <CommandDialog open={open} onOpenChange={setOpen} title={t('title')} description={t('description')}>
      <CommandInput placeholder={t('placeholder')} />
      <CommandList className="py-1">
        <CommandEmpty>{t('empty')}</CommandEmpty>
        <CommandGroup heading={t('groupNavigation')}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.href}
                className="rounded-md px-3 h-12 cursor-pointer"
                value={`${tNav(item.labelKey)} ${item.href}`}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <Icon />
                {tNav(item.labelKey)}
              </CommandItem>
            )
          })}
          <CommandItem
            className="rounded-md px-3 h-12 cursor-pointer"
            value={`${tCommon('settings')} /settings`}
            onSelect={() => runCommand(() => router.push('/settings'))}
          >
            <Settings />
            {tCommon('settings')}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator className='mx-1 mb-2' />
        <CommandGroup heading={t('groupActions')}>
          {isLoggedIn && (
            <CommandItem
              value={t('createBinder')}
              className="rounded-md px-3 h-12 cursor-pointer"
              onSelect={() => runCommand(() => router.push('/binders?new=1'))}
            >
              <Plus />
              {t('createBinder')}
            </CommandItem>
          )}
          <CommandItem
            value={t('toggleTheme')}
            className="rounded-md px-3 h-12 cursor-pointer"
            onSelect={() =>
              runCommand(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))
            }
          >
            {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
            {t('toggleTheme')}
          </CommandItem>
          {LOCALES.filter((locale) => locale !== activeLocale).map((locale: Locale) => (
            <CommandItem
              key={locale}
              value={`${t('switchLanguage')} ${LOCALE_LABELS[locale]}`}
              className="rounded-md px-3 h-12 cursor-pointer"
              onSelect={() =>
                runCommand(() => {
                  setLocale(locale).then(() => router.refresh())
                })
              }
            >
              <Globe />
              {t('switchLanguage')} — {LOCALE_LABELS[locale]}
            </CommandItem>
          ))}
          {isLoggedIn && (
            <CommandItem
              data-testid="command-report-trigger"
              value={tReport('trigger')}
              className="rounded-md px-3 h-12 cursor-pointer"
              onSelect={() => runCommand(() => setReportOpen(true))}
            >
              <Flag />
              {tReport('trigger')}
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
    <ReportDialog open={reportOpen} onOpenChange={setReportOpen} />
    </>
  )
}
