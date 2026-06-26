'use client'

import { Search } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SeriesCombobox } from '@/components/cards/series-combobox'
import { SetGroup } from '@/types/card'

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'owned', label: '擁有' },
  { value: 'wanted', label: '想要' },
] as const

const GAME_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'PTCG', label: 'Pokemon TCG' },
  { value: 'OPCG', label: 'One Piece TCG' },
] as const

const LANGUAGE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'ZH_TW', label: '繁體中文' },
  { value: 'JA', label: '日本語' },
  { value: 'EN', label: 'English' },
] as const

interface CollectionFiltersProps {
  status: 'all' | 'owned' | 'wanted'
  onStatusChange: (s: 'all' | 'owned' | 'wanted') => void
  game: string
  onGameChange: (g: string) => void
  language: string
  onLanguageChange: (l: string) => void
  groups: SetGroup[]
  selectedSetId: string | null
  onSetChange: (setId: string | null) => void
  query: string
  onQueryChange: (q: string) => void
}

export function CollectionFilters({
  status,
  onStatusChange,
  game,
  onGameChange,
  language,
  onLanguageChange,
  groups,
  selectedSetId,
  onSetChange,
  query,
  onQueryChange,
}: CollectionFiltersProps) {
  const setEnabled = Boolean(game && language)

  return (
    <div className="flex flex-col gap-3">
      {/* 桌面：全部 tabs + 搜尋框同一列；行動：wrap 換行 */}
      <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
        <Tabs value={status} onValueChange={v => onStatusChange(v as 'all' | 'owned' | 'wanted')}>
          <TabsList>
            {STATUS_OPTIONS.map(opt => (
              <TabsTrigger key={opt.value} value={opt.value} data-testid={`status-filter-${opt.value}`}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs value={game || 'all'} onValueChange={v => onGameChange(v === 'all' ? '' : v)}>
          <TabsList>
            {GAME_OPTIONS.map(opt => (
              <TabsTrigger key={opt.value} value={opt.value} data-testid={`game-filter-${opt.value}`}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs value={language || 'all'} onValueChange={v => onLanguageChange(v === 'all' ? '' : v)}>
          <TabsList>
            {LANGUAGE_OPTIONS.map(opt => (
              <TabsTrigger key={opt.value} value={opt.value} data-testid={`language-filter-${opt.value}`}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {setEnabled && (
          <div className="flex flex-wrap items-center gap-3">
            <SeriesCombobox
              groups={groups}
              selectedSetId={selectedSetId}
              onSetChange={onSetChange}
            />
          </div>
        )}

        <div className="w-full lg:w-auto lg:flex-1 lg:ml-auto">
          <InputGroup className="w-full">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              placeholder="搜尋卡牌名稱或型號..."
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              data-testid="collection-search-input"
            />
          </InputGroup>
        </div>
      </div>
    </div>
  )
}
