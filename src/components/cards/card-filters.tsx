'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TwoColumnSelectGroup } from '@/components/ui/two-column-select-group'
import { SetGroup } from '@/types/card'

const ALL_SETS = 'all'

const LANGUAGE_OPTIONS = [
  { value: 'ZH_TW', label: '繁體中文' },
  { value: 'JA', label: '日本語' },
  { value: 'EN', label: 'English' },
] as const

interface CardFiltersProps {
  query: string
  onQueryChange: (q: string) => void
  language: string
  onLanguageChange: (language: string) => void
  groups: SetGroup[]
  selectedSetId: string | null
  onSetChange: (setId: string | null) => void
}

export function CardFilters({
  query,
  onQueryChange,
  language,
  onLanguageChange,
  groups,
  selectedSetId,
  onSetChange,
}: CardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Input
        data-testid="search-input"
        type="text"
        placeholder="搜尋卡牌名稱或型號..."
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
        <SelectContent position="popper" align="end">
          <SelectItem value={ALL_SETS}>所有系列</SelectItem>
          {groups.map(group => (
            <React.Fragment key={group.series}>
              <SelectSeparator />
              <TwoColumnSelectGroup label={group.series}>
                {group.sets.map(set => (
                  <SelectItem key={set.id} value={set.id} className="w-full">
                    {set.name} <span className="text-muted-foreground">{set.externalId}</span>
                  </SelectItem>
                ))}
              </TwoColumnSelectGroup>
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
