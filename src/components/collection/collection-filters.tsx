'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PILL_TABS_LIST, PILL_TABS_TRIGGER } from '@/lib/tabs-styles'
import { SeriesCombobox } from '@/components/cards/series-combobox'
import { SetGroup } from '@/types/card'

const STATUS_VALUES = ['all', 'owned', 'wanted'] as const
const GAME_VALUES = ['all', 'PTCG', 'OPCG'] as const
const LANGUAGE_VALUES = ['all', 'ZH_TW', 'JA', 'EN'] as const

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
  const t = useTranslations('collection.filters')
  const tCards = useTranslations('cards')
  const tCardDetail = useTranslations('cardDetail')
  const setEnabled = Boolean(game && language)

  const statusLabel = (v: (typeof STATUS_VALUES)[number]) =>
    v === 'all' ? t('all') : v === 'owned' ? tCardDetail('owned') : tCardDetail('wanted')
  const gameLabel = (v: (typeof GAME_VALUES)[number]) =>
    v === 'all' ? t('all') : tCards(`games.${v}`)
  const languageLabel = (v: (typeof LANGUAGE_VALUES)[number]) =>
    v === 'all' ? t('all') : tCards(`languages.${v}`)

  return (
    <div className="flex flex-col gap-3">
      {/* 桌面：全部 tabs + 搜尋框同一列；行動：wrap 換行 */}
      <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
        <Tabs value={status} onValueChange={v => onStatusChange(v as 'all' | 'owned' | 'wanted')}>
          <TabsList className={PILL_TABS_LIST}>
            {STATUS_VALUES.map(value => (
              <TabsTrigger key={value} value={value} className={PILL_TABS_TRIGGER} data-testid={`status-filter-${value}`}>
                {statusLabel(value)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs value={game || 'all'} onValueChange={v => onGameChange(v === 'all' ? '' : v)}>
          <TabsList className={PILL_TABS_LIST}>
            {GAME_VALUES.map(value => (
              <TabsTrigger key={value} value={value} className={PILL_TABS_TRIGGER} data-testid={`game-filter-${value}`}>
                {gameLabel(value)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs value={language || 'all'} onValueChange={v => onLanguageChange(v === 'all' ? '' : v)}>
          <TabsList className={PILL_TABS_LIST}>
            {LANGUAGE_VALUES.map(value => (
              <TabsTrigger key={value} value={value} className={PILL_TABS_TRIGGER} data-testid={`language-filter-${value}`}>
                {languageLabel(value)}
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
              placeholder={t('searchPlaceholder')}
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
