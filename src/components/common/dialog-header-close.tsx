'use client'

import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { DialogClose, DialogHeader } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface DialogHeaderCloseProps {
  /** DialogTitle（可含 icon/inline 內容），放左側 */
  children: ReactNode
  /** 可選：DialogDescription 或說明文字，置於 title row 下方 */
  description?: ReactNode
  className?: string
}

/**
 * Dialog header with a custom X close button aligned right on the title row.
 * Compose with `<DialogContent showCloseButton={false}>` to replace the native
 * absolute-positioned close button with an in-flow one that lives inside the
 * header, aligned to the title. `children` receives the whole `DialogTitle`
 * so callers keep full control over title content (e.g. an inline icon).
 */
export function DialogHeaderClose({
  children,
  description,
  className,
}: DialogHeaderCloseProps) {
  const t = useTranslations('common')

  return (
    <DialogHeader className={className}>
      <div className="flex items-center justify-between gap-2">
        {children}
        <DialogClose
          className={cn(
            'shrink-0 rounded-xs opacity-70 transition-opacity hover:opacity-100',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            'disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
          )}
        >
          <X className="size-5" />
          <span className="sr-only">{t('close')}</span>
        </DialogClose>
      </div>
      {description}
    </DialogHeader>
  )
}
