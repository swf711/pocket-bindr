'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/password-input'
import { Progress } from '@/components/ui/progress'
import { FieldDescription } from '@/components/ui/field'
import { getPasswordStrength } from '@/lib/password-policy'

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(newPassword)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.error === 'WRONG_PASSWORD') {
          setError('目前密碼不正確')
        } else if (data?.error === 'INVALID_NEW_PASSWORD') {
          setError('新密碼至少需要 8 個字元')
        } else {
          toast.error('更新失敗')
        }
        return
      }
      toast('密碼已更新')
      setCurrentPassword('')
      setNewPassword('')
    } catch {
      toast.error('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="current-password">目前密碼</Label>
        <PasswordInput
          id="current-password"
          data-testid="current-password-input"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value)
            setError(null)
          }}
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">新密碼</Label>
        <PasswordInput
          id="new-password"
          data-testid="new-password-input"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value)
            setError(null)
          }}
          autoComplete="new-password"
          placeholder="最少 8 個字元"
        />
        {newPassword.length > 0 && (
          <div className="space-y-1" data-testid="password-strength">
            <Progress value={((strength.score + 1) / 4) * 100} className="h-1.5" />
            <FieldDescription>密碼強度：{strength.label}</FieldDescription>
          </div>
        )}
        {error && (
          <p data-testid="password-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button
        type="submit"
        data-testid="save-password-btn"
        disabled={loading}
      >
        {loading ? '更新中…' : '修改密碼'}
      </Button>
    </form>
  )
}
