'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BinderSummary } from '@/types/binder'
import { Trash2Icon } from 'lucide-react'
import { Button } from '../ui/button'

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
      toast.success(tList('deleted'))
      onOpenChange(false)
    } catch {
      toast.error(t('deleteFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-error-container text-on-error-container">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('description', { count: binder?._count.slots ?? 0 })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="lg" disabled={loading} className="rounded-full!">
            {t('cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            size="lg"
            onClick={handleConfirm}
            disabled={loading}
            data-testid="confirm-delete-binder"
          >
            {loading ? t('deleting') : t('confirmDelete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
