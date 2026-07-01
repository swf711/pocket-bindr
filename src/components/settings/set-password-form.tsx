'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('settings.setPassword')
  const tAuth = useTranslations('auth')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(newPassword)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid(newPassword)) {
      setError(t('minLength', { min: MIN_PASSWORD_LENGTH }))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'))
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
          setError(t('minLength', { min: MIN_PASSWORD_LENGTH }))
        } else {
          toast.error(t('setFailed'))
        }
        return
      }
      toast(t('setSuccess'))
      setNewPassword('')
      setConfirmPassword('')
      router.refresh()
    } catch {
      toast.error(t('setFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="set-password">{t('newPasswordLabel')}</Label>
        <PasswordInput
          id="set-password"
          data-testid="set-password-input"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value)
            setError(null)
          }}
          autoComplete="new-password"
          placeholder={t('newPasswordPlaceholder')}
        />
        {newPassword.length > 0 && (
          <div className="space-y-1" data-testid="set-password-strength">
            <Progress value={((strength.score + 1) / 4) * 100} className="h-1.5" />
            <FieldDescription>{tAuth('strength.label', { level: tAuth(`strength.${strength.score}`) })}</FieldDescription>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="set-password-confirm">{t('confirmPasswordLabel')}</Label>
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
        {loading ? t('setting') : t('submit')}
      </Button>
    </form>
  )
}
