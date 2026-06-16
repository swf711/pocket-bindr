'use client'

import { Search } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { SeriesCombobox } from './series-combobox'
import { SetGroup } from '@/types/card'
import { cn } from '@/lib/utils'

interface CardFiltersProps {
  query: string
  onQueryChange: (q: string) => void
  groups: SetGroup[]
  selectedSetId: string | null
  onSetChange: (setId: string | null) => void
  className?: string
}

export function CardFilters({
  query,
  onQueryChange,
  groups,
  selectedSetId,
  onSetChange,
  className,
}: CardFiltersProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
      <SeriesCombobox
        groups={groups}
        selectedSetId={selectedSetId}
        onSetChange={onSetChange}
      />
      <InputGroup className="flex-1">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          data-testid="search-input"
          type="text"
          placeholder="搜尋卡牌名稱或型號..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </InputGroup>
    </div>
  )
}
