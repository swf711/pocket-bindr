'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function DeleteAccountSection() {
  const t = useTranslations('settings.dangerZone')
  const [confirmInput, setConfirmInput] = useState('')
  const [loading, setLoading] = useState(false)

  const canDelete = confirmInput === 'DELETE'

  async function handleDelete() {
    if (!canDelete) return
    setLoading(true)
    try {
      const res = await fetch('/api/user', { method: 'DELETE' })
      if (res.ok) {
        await signOut({ callbackUrl: '/login?account_deleted=true' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" variant="destructive">{t('deleteAccount')}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-error-container text-on-error-container">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('confirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          data-testid="delete-confirm-input"
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          placeholder={t('confirmPlaceholder')}
        />
        <AlertDialogFooter>
          <AlertDialogCancel
            variant="outline"
            size="lg"
            className="rounded-full!"
            onClick={() => setConfirmInput('')}
          >
            {t('cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            size="lg"
            data-testid="confirm-delete-btn"
            disabled={!canDelete || loading}
            onClick={handleDelete}
          >
            {loading ? t('deleting') : t('confirmDelete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
