'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
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
        <Button variant="destructive">刪除帳號</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認刪除帳號？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作無法復原。您的帳號、收藏卡牌與卡冊將永久刪除。
            請在下方輸入「DELETE」以確認。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          data-testid="delete-confirm-input"
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          placeholder="輸入 DELETE 確認"
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmInput('')}>取消</AlertDialogCancel>
          <AlertDialogAction
            data-testid="confirm-delete-btn"
            disabled={!canDelete || loading}
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? '刪除中...' : '確認刪除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
