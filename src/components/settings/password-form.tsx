'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/password-input'
import { Progress } from '@/components/ui/progress'
import { FieldDescription } from '@/components/ui/field'
import { getPasswordStrength } from '@/lib/password-policy'

export function PasswordForm() {
  const t = useTranslations('settings.changePassword')
  const tAuth = useTranslations('auth')
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
          setError(t('wrongPassword'))
        } else if (data?.error === 'INVALID_NEW_PASSWORD') {
          setError(t('newPasswordTooShort'))
        } else {
          toast.error(t('updateFailed'))
        }
        return
      }
      toast(t('updateSuccess'))
      setCurrentPassword('')
      setNewPassword('')
    } catch {
      toast.error(t('updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="current-password">{t('currentPasswordLabel')}</Label>
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
        <Label htmlFor="new-password">{t('newPasswordLabel')}</Label>
        <PasswordInput
          id="new-password"
          data-testid="new-password-input"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value)
            setError(null)
          }}
          autoComplete="new-password"
          placeholder={t('newPasswordPlaceholder')}
        />
        {newPassword.length > 0 && (
          <div className="space-y-1" data-testid="password-strength">
            <Progress value={((strength.score + 1) / 4) * 100} className="h-1.5" />
            <FieldDescription>{tAuth('strength.label', { level: tAuth(`strength.${strength.score}`) })}</FieldDescription>
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
        {loading ? t('updating') : t('submit')}
      </Button>
    </form>
  )
}
