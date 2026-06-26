'use client'

import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SeriesCombobox } from '@/components/cards/series-combobox'
import { SetGroup } from '@/types/card'

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
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={status} onValueChange={v => onStatusChange(v as 'all' | 'owned' | 'wanted')}>
          <TabsList>
            <TabsTrigger value="all" data-testid="status-filter-all">全部</TabsTrigger>
            <TabsTrigger value="owned" data-testid="status-filter-owned">擁有</TabsTrigger>
            <TabsTrigger value="wanted" data-testid="status-filter-wanted">想要</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={game || 'all'} onValueChange={v => onGameChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-32" data-testid="game-filter">
            <SelectValue placeholder="全部遊戲" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部遊戲</SelectItem>
            <SelectItem value="PTCG">PTCG</SelectItem>
            <SelectItem value="OPCG">OPCG</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={language || 'all'}
          onValueChange={v => onLanguageChange(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-32" data-testid="language-filter">
            <SelectValue placeholder="全部語言" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部語言</SelectItem>
            <SelectItem value="ZH_TW">繁中</SelectItem>
            <SelectItem value="JA">日文</SelectItem>
            <SelectItem value="EN">英文</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {setEnabled && (
          <SeriesCombobox
            groups={groups}
            selectedSetId={selectedSetId}
            onSetChange={onSetChange}
          />
        )}
        <Input
          className="w-full sm:w-72"
          placeholder="搜尋卡牌名稱…"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          data-testid="collection-search-input"
        />
      </div>
    </div>
  )
}
