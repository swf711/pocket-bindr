'use client'

import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const LANGUAGE_VALUES = ['ZH_TW', 'JA', 'EN'] as const

interface LanguageTabsProps {
  language: string
  onLanguageChange: (language: string) => void
}

export function LanguageTabs({ language, onLanguageChange }: LanguageTabsProps) {
  const t = useTranslations('cards')
  const LANGUAGE_OPTIONS = LANGUAGE_VALUES.map((value) => ({ value, label: t(`languages.${value}`) }))
  return (
    <Tabs
      data-testid="language-tabs"
      value={language}
      onValueChange={onLanguageChange}
    >
      <TabsList className="rounded-full">
        {LANGUAGE_OPTIONS.map(lang => (
          <TabsTrigger
            key={lang.value}
            className="rounded-full data-[state=active]:bg-primary-container data-[state=active]:text-on-primary-container dark:data-[state=active]:bg-primary-container dark:data-[state=active]:text-on-primary-container"
            data-testid={`language-tab-${lang.value.toLowerCase()}`}
            value={lang.value}
          >
            {lang.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
