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

interface SetOption {
  id: string
  name: string
  series: string
}

interface CardFiltersProps {
  query: string
  onQueryChange: (q: string) => void
  sets: SetOption[]
  selectedSetId: string | null
  onSetChange: (setId: string | null) => void
}

export function CardFilters({ query, onQueryChange, sets, selectedSetId, onSetChange }: CardFiltersProps) {
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
