'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Game, Language } from '@prisma/client'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { SeriesCombobox } from './series-combobox'
import { SearchHelp } from './search-help'
import { getSearchExample, getSearchExampleName } from '@/lib/search-example'
import { SetGroup } from '@/types/card'
import { cn } from '@/lib/utils'

interface CardFiltersProps {
  query: string
  onQueryChange: (q: string) => void
  groups: SetGroup[]
  selectedSetId: string | null
  onSetChange: (setId: string | null) => void
  game: Game
  language: Language
  className?: string
}

export function CardFilters({
  query,
  onQueryChange,
  groups,
  selectedSetId,
  onSetChange,
  game,
  language,
  className,
}: CardFiltersProps) {
  const t = useTranslations('cards')
  const placeholder = t('searchPlaceholderExample', {
    name: getSearchExampleName(game, language),
    code: getSearchExample(game, language),
  })
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
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <SearchHelp game={game} />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
