'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LegalDocumentBody } from '@/components/legal/legal-document-body'

interface LegalDialogProps {
  namespace: 'privacy' | 'terms'
  children: ReactNode
}

/**
 * Opens the Terms/Privacy content in-place as a Dialog instead of navigating
 * away, used by the register/login consent lines. `type="button"` keeps the
 * inline trigger from submitting the surrounding auth form.
 */
export function LegalDialog({ namespace, children }: LegalDialogProps) {
  const t = useTranslations(namespace)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-primary underline-offset-4 hover:underline"
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70dvh] overflow-y-auto pr-4 -mr-2">
          <LegalDocumentBody namespace={namespace} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
