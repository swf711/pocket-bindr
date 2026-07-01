'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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
        <Button variant="destructive">{t('deleteAccount')}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
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
          <AlertDialogCancel onClick={() => setConfirmInput('')}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            data-testid="confirm-delete-btn"
            disabled={!canDelete || loading}
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? t('deleting') : t('confirmDelete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
