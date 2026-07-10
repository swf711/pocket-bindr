'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/schemas/auth'
import { resolveFieldError } from '@/lib/schemas/field-error'

export function ForgotPasswordForm() {
  const t = useTranslations('auth')
  const tRoot = useTranslations()
  const [submitted, setSubmitted] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    setRateLimited(false)

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.status === 429) {
      setRateLimited(true)
      return
    }

    setSubmitted(true)
  })

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl" role="heading" aria-level={1}>{t('forgot.title')}</CardTitle>
          <CardDescription>
            {t('forgot.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rateLimited && (
            <Alert
              variant="destructive"
              data-testid="rate-limit-alert"
              className="bg-error-container text-error-foreground border-none"
            >
              <AlertCircleIcon />
              <AlertTitle>{t('forgot.rateLimitedTitle')}</AlertTitle>
              <AlertDescription>{t('forgot.rateLimited')}</AlertDescription>
            </Alert>
          )}
          {submitted ? (
            <Alert data-testid="forgot-password-success-alert">
              <CheckCircle2Icon />
              <AlertTitle>{t('forgot.successTitle')}</AlertTitle>
              <AlertDescription>
                {t('forgot.successAlert')}
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <FieldGroup>
                <Controller
                  control={control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel htmlFor="email">{t('email')}</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                      <FieldError errors={fieldState.error ? [{ message: resolveFieldError(fieldState.error, tRoot) }] : undefined} />
                    </Field>
                  )}
                />
                <Field>
                  <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? t('forgot.submitting') : t('forgot.submit')}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
          <FieldDescription className="text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              {t('forgot.backToLogin')}
            </Link>
          </FieldDescription>
        </CardContent>
      </Card>
    </div>
  )
}
