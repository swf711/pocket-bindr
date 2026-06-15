'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const LANGUAGE_OPTIONS = [
  { value: 'ZH_TW', label: '繁體中文' },
  { value: 'JA', label: '日本語' },
  { value: 'EN', label: 'English' },
] as const

interface LanguageTabsProps {
  language: string
  onLanguageChange: (language: string) => void
}

export function LanguageTabs({ language, onLanguageChange }: LanguageTabsProps) {
  return (
    <Tabs
      data-testid="language-tabs"
      value={language}
      onValueChange={onLanguageChange}
    >
      <TabsList>
        {LANGUAGE_OPTIONS.map(lang => (
          <TabsTrigger
            key={lang.value}
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
