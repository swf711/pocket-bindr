'use client'

import { useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { PasswordInput } from '@/components/auth/password-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { getPasswordStrength, MIN_PASSWORD_LENGTH } from '@/lib/password-policy'
import { resetPasswordSchema } from '@/lib/schemas/auth'
import { resolveFieldError } from '@/lib/schemas/field-error'

const STRENGTH_COLORS = ['bg-destructive', 'bg-destructive', 'bg-yellow-500', 'bg-green-500'] as const

/**
 * 表單專用 schema：沿用共用 resetPasswordSchema 的 newPassword 規則，
 * 拿掉不需要使用者輸入的 token（由 prop 帶入），疊加 confirmPassword 純前端比對。
 */
const resetPasswordFormSchema = resetPasswordSchema
  .omit({ token: true })
  .extend({ confirmPassword: z.string() })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PASSWORD_MISMATCH',
        path: ['confirmPassword'],
      })
    }
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>

interface ResetPasswordFormProps {
  token?: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const t = useTranslations('auth')
  const tRoot = useTranslations()
  const [error, setError] = useState<string | null>(null)
  // Tracks whether the current error is a token issue (expired/invalid) so we can
  // offer the "request a new link" affordance without substring-matching localized text.
  const [canReapply, setCanReapply] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const password = watch('newPassword')
  const strength = getPasswordStrength(password)

  if (!token) {
    return (
      <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
        <CardContent className="space-y-4">
          <Alert variant="destructive" data-testid="reset-invalid-alert" className="bg-error-container text-error-foreground border-none">
            <AlertDescription>{t('reset.invalidLink')}</AlertDescription>
          </Alert>
          <Button asChild size="lg" className="w-full">
            <Link href="/forgot-password">{t('reset.reapply')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const onValid = async ({ newPassword }: ResetPasswordFormValues) => {
    setError(null)
    setCanReapply(false)

    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
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

  const onInvalid = (errors: FieldErrors<ResetPasswordFormValues>) => {
    const firstError = errors.newPassword ?? errors.confirmPassword
    if (firstError) {
      setError(resolveFieldError(firstError, tRoot) ?? null)
    }
  }

  const onSubmit = handleSubmit(onValid, onInvalid)

  return (
    <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl" role="heading" aria-level={1}>{t('reset.title')}</CardTitle>
        <CardDescription>{t('reset.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" data-testid="reset-error-alert" className="bg-error-container text-error-foreground border-none">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-password">{t('newPassword')}</FieldLabel>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                required
                {...register('newPassword')}
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
                autoComplete="new-password"
                required
                {...register('confirmPassword')}
              />
            </Field>
            <Field>
              <Button type="submit" size="lg" disabled={loading}>
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
  )
}
