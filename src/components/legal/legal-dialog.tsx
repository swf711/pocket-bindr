'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { LegalDocumentBody } from '@/components/legal/legal-document-body'
import { cn } from '@/lib/utils'

interface LegalDialogProps {
  namespace: 'privacy' | 'terms'
  children: ReactNode
  /** Extra classes for the inline trigger, e.g. light link color over a dark overlay. */
  className?: string
}

/**
 * Opens the Terms/Privacy content in-place as a Dialog instead of navigating
 * away, used by the register/login consent lines. Document-viewer layout:
 * fixed header + scrollable body + fixed bottom close button (no top-right X).
 * `type="button"` keeps the inline trigger from submitting the surrounding
 * auth form.
 */
export function LegalDialog({ namespace, children, className }: LegalDialogProps) {
  const t = useTranslations(namespace)
  const tCommon = useTranslations('common')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn('text-primary underline-offset-4 hover:underline', className)}
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="sm:max-w-2xl p-0 gap-0 overflow-hidden"
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle className="text-xl">{t('title')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t('lastUpdatedLabel')}：{t('lastUpdated')}
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4">
            <LegalDocumentBody namespace={namespace} hideHeader />
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t px-6 py-4 flex justify-end">
          <DialogClose asChild>
            <Button variant="secondary" size="lg" className="rounded-full">
              {tCommon('close')}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
