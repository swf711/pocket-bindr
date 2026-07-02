'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Fragment } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { SetGroup } from '@/types/card'

const ALL_SETS = 'all'

interface SeriesComboboxProps {
  groups: SetGroup[]
  selectedSetId: string | null
  onSetChange: (setId: string | null) => void
}

export function SeriesCombobox({ groups, selectedSetId, onSetChange }: SeriesComboboxProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('cards')

  const selectedSet = groups
    .flatMap(g => g.sets)
    .find(s => s.id === selectedSetId)

  const handleSelect = (setId: string | null) => {
    onSetChange(setId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="set-combobox"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal sm:w-64"
        >
          <span className="truncate">
            {selectedSet ? (
              <>
                {selectedSet.name}{' '}
                <span className="text-muted-foreground">{selectedSet.externalId}</span>
              </>
            ) : (
              t('allSets')
            )}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-[min(40rem,90vw)] max-w-[90vw] p-0"
        align="end"
      >
        <Command>
          <CommandInput placeholder={t('searchSets')} />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>{t('noSetsFound')}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={t('allSets')}
                onSelect={() => handleSelect(null)}
                className={cn('min-h-(--m3-touch-min) justify-between text-left', !selectedSetId && 'bg-secondary-container text-on-secondary-container font-medium')}
              >
                {t('allSets')}
                <Check className={cn('ml-2 shrink-0', !selectedSetId ? 'opacity-100' : 'opacity-0')} />
              </CommandItem>
            </CommandGroup>
            {groups.map((group, i) => (
              <Fragment key={group.series}>
                {i > 0 && <CommandSeparator />}
                <CommandGroup
                  heading={group.series}
                  className="**:[[cmdk-group-items]]:grid **:[[cmdk-group-items]]:sm:grid-cols-2 **:[[cmdk-group-items]]:gap-x-1"
                >
                {group.sets.map(set => (
                  <CommandItem
                    key={set.id}
                    value={set.id}
                    keywords={[set.name, set.externalId]}
                    onSelect={() => handleSelect(set.id)}
                    className={cn('min-h-(--m3-touch-min) justify-between text-left', selectedSetId === set.id && 'bg-secondary-container text-on-secondary-container font-medium')}
                  >
                    <span className="whitespace-nowrap">
                      {set.name}{' '}
                      <span className="text-muted-foreground">{set.externalId}</span>
                    </span>
                    <Check
                      className={cn('ml-2 shrink-0', selectedSetId === set.id ? 'opacity-100' : 'opacity-0')}
                    />
                  </CommandItem>
                ))}
                </CommandGroup>
              </Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { ALL_SETS }
