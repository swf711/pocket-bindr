'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { PasswordInput } from '@/components/auth/password-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { getPasswordStrength, isPasswordValid, MIN_PASSWORD_LENGTH } from '@/lib/password-policy'

const STRENGTH_COLORS = ['bg-destructive', 'bg-destructive', 'bg-yellow-500', 'bg-green-500'] as const

interface ResetPasswordFormProps {
  token?: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const t = useTranslations('auth')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Tracks whether the current error is a token issue (expired/invalid) so we can
  // offer the "request a new link" affordance without substring-matching localized text.
  const [canReapply, setCanReapply] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(password)

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Alert variant="destructive" data-testid="reset-invalid-alert">
            <AlertDescription>{t('reset.invalidLink')}</AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link href="/forgot-password">{t('reset.reapply')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCanReapply(false)

    if (!isPasswordValid(password)) {
      setError(t('weakPassword', { min: MIN_PASSWORD_LENGTH }))
      return
    }
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    })
    setLoading(false)

    if (res.ok) {
      router.push('/login?reset=success')
      return
    }

    const data = await res.json() as { error?: string }
    if (data.error === 'TOKEN_EXPIRED') {
      setError(t('reset.tokenExpired'))
      setCanReapply(true)
    } else if (data.error === 'TOKEN_INVALID') {
      setError(t('reset.tokenInvalid'))
      setCanReapply(true)
    } else if (data.error === 'INVALID_NEW_PASSWORD') {
      setError(t('weakPassword', { min: MIN_PASSWORD_LENGTH }))
    } else {
      setError(t('reset.genericError'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl" role="heading" aria-level={1}>{t('reset.title')}</CardTitle>
          <CardDescription>{t('reset.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" data-testid="reset-error-alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-password">{t('newPassword')}</FieldLabel>
                <PasswordInput
                  id="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {password.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <Progress
                      value={(strength.score / 3) * 100}
                      className={`h-1 [&>div]:${STRENGTH_COLORS[strength.score]}`}
                    />
                    <p className="text-xs text-muted-foreground">{t(`strength.${strength.score}`)}</p>
                  </div>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">{t('confirmPassword')}</FieldLabel>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? t('reset.submitting') : t('reset.submit')}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          {canReapply && (
            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                {t('reset.reapply')}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
