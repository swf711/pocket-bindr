'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/password-input'
import { Progress } from '@/components/ui/progress'
import { FieldDescription } from '@/components/ui/field'
import {
  getPasswordStrength,
  isPasswordValid,
  MIN_PASSWORD_LENGTH,
} from '@/lib/password-policy'

// Lets a pure-OAuth user (no existing password) set one as a login escape
// hatch. No current-password field; "confirm password" is a front-end only
// check (not sent to the API), mirroring the register form.
export function SetPasswordForm() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(newPassword)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid(newPassword)) {
      setError(`密碼至少需要 ${MIN_PASSWORD_LENGTH} 個字元`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('兩次輸入的密碼不一致')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.error === 'INVALID_NEW_PASSWORD') {
          setError(`密碼至少需要 ${MIN_PASSWORD_LENGTH} 個字元`)
        } else {
          toast.error('設定失敗')
        }
        return
      }
      toast('密碼已設定')
      setNewPassword('')
      setConfirmPassword('')
      router.refresh()
    } catch {
      toast.error('設定失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="set-password">新密碼</Label>
        <PasswordInput
          id="set-password"
          data-testid="set-password-input"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value)
            setError(null)
          }}
          autoComplete="new-password"
          placeholder="最少 8 個字元"
        />
        {newPassword.length > 0 && (
          <div className="space-y-1" data-testid="set-password-strength">
            <Progress value={((strength.score + 1) / 4) * 100} className="h-1.5" />
            <FieldDescription>密碼強度：{strength.label}</FieldDescription>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="set-password-confirm">確認密碼</Label>
        <PasswordInput
          id="set-password-confirm"
          data-testid="set-password-confirm-input"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            setError(null)
          }}
          autoComplete="new-password"
        />
        {error && (
          <p data-testid="set-password-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" data-testid="save-set-password-btn" disabled={loading}>
        {loading ? '設定中…' : '設定密碼'}
      </Button>
    </form>
  )
}
