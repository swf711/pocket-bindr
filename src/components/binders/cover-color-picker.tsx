'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { COVER_COLOR_PRESETS } from '@/lib/cover-colors'
import { useState } from 'react'

interface CoverColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function CoverColorPicker({ value, onChange }: CoverColorPickerProps) {
  const [open, setOpen] = useState(false)

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
          封面顏色
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="grid grid-cols-4 gap-2">
          {COVER_COLOR_PRESETS.map(color => (
            <button
              key={color}
              type="button"
              title={color}
              className="w-8 h-8 rounded-sm border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: color === value ? '#fff' : 'transparent',
                outline: color === value ? '2px solid #000' : 'none',
                outlineOffset: '1px',
              }}
              onClick={() => {
                onChange(color)
                setOpen(false)
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
