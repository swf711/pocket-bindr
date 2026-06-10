'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALL_SETS = 'all'

const LANGUAGE_OPTIONS = [
  { value: 'EN', label: 'English' },
  { value: 'JA', label: '日本語' },
  { value: 'ZH_TW', label: '繁體中文' },
] as const

interface SetOption {
  id: string
  name: string
  series: string
}

interface CardFiltersProps {
  query: string
  onQueryChange: (q: string) => void
  language: string
  onLanguageChange: (language: string) => void
  sets: SetOption[]
  selectedSetId: string | null
  onSetChange: (setId: string | null) => void
}

export function CardFilters({
  query,
  onQueryChange,
  language,
  onLanguageChange,
  sets,
  selectedSetId,
  onSetChange,
}: CardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Input
        data-testid="search-input"
        type="text"
        placeholder="搜尋卡牌名稱..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="flex-1"
      />
      <Select value={language} onValueChange={onLanguageChange}>
        <SelectTrigger data-testid="language-filter" className="w-full sm:w-40">
          <SelectValue placeholder="語言" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map(lang => (
            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedSetId ?? ALL_SETS}
        onValueChange={(value) => onSetChange(value === ALL_SETS ? null : value)}
      >
        <SelectTrigger data-testid="set-filter" className="w-full sm:w-64">
          <SelectValue placeholder="所有系列" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SETS}>所有系列</SelectItem>
          {sets.map(s => (
            <SelectItem key={s.id} value={s.id}>{s.series} - {s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
