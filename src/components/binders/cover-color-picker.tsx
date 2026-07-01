'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { COVER_COLOR_PRESETS } from '@/lib/cover-colors'

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

interface CoverColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function CoverColorPicker({ value, onChange }: CoverColorPickerProps) {
  const t = useTranslations('binderList.coverColorPicker')
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  function handleInputChange(raw: string) {
    const normalized = raw.startsWith('#') ? raw : `#${raw}`
    setInputValue(raw)
    if (HEX_RE.test(normalized)) {
      onChange(normalized)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-testid="cover-color-picker"
          className="flex items-center gap-2"
        >
          <span
            className="inline-block w-5 h-5 rounded-sm border border-border"
            style={{ backgroundColor: value }}
          />
          {t('label')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 space-y-3">
        <HexColorPicker color={value} onChange={onChange} />
        <Input
          value={inputValue}
          onChange={e => handleInputChange(e.target.value)}
          placeholder="#4A5568"
          className="h-8 font-mono text-sm"
          maxLength={7}
        />
        <div className="grid grid-cols-6 gap-1.5">
          {COVER_COLOR_PRESETS.map(color => (
            <button
              key={color}
              type="button"
              title={color}
              className="w-7 h-7 rounded-sm border-2 transition-transform hover:scale-110 ring-1 ring-border"
              style={{
                backgroundColor: color,
                borderColor: color === value ? '#fff' : 'transparent',
                outline: color === value ? '2px solid #000' : 'none',
                outlineOffset: '1px',
              }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
