'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BinderSummary } from '@/types/binder'

interface DeleteBinderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  binder: BinderSummary | null
  onDeleted: (id: string) => void
}

export function DeleteBinderDialog({
  open,
  onOpenChange,
  binder,
  onDeleted,
}: DeleteBinderDialogProps) {
  const t = useTranslations('binderList.deleteDialog')
  const tList = useTranslations('binderList')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (!binder) return
    setLoading(true)
    try {
      const res = await fetch(`/api/binders/${binder.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? t('deleteFailed'))
      }
      onDeleted(binder.id)
      toast(tList('deleted'))
      onOpenChange(false)
    } catch (err) {
      toast((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('description', { count: binder?._count.slots ?? 0 })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
              data-testid="confirm-delete-binder"
            >
              {loading ? t('deleting') : t('confirmDelete')}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
