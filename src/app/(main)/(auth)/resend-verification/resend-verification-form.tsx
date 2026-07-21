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
import { resendVerificationFormSchema, type ResendVerificationFormInput } from '@/lib/schemas/auth'
import { resolveFieldError } from '@/lib/schemas/field-error'

// 架構與 forgot-password-form 逐字同構（兩者都是「輸入 email → 寄信 → 一律回 200」）：
// 失效連結卡（/verify-signup）只負責導向本頁，重寄表單集中於此。
export function ResendVerificationForm() {
  const t = useTranslations('auth')
  const tRoot = useTranslations()
  const [submitted, setSubmitted] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResendVerificationFormInput>({
    resolver: zodResolver(resendVerificationFormSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    setRateLimited(false)

    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.status === 429) {
      setRateLimited(true)
      return
    }

    // 端點一律回 200 防 enumeration，故成功狀態只代表「請求已送出」，
    // 不代表該 email 存在或未驗證。
    setSubmitted(true)
  })

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl" role="heading" aria-level={1}>{t('resendVerification.title')}</CardTitle>
          <CardDescription>
            {t('resendVerification.subtitle')}
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
              <AlertTitle>{t('resendVerification.rateLimitedTitle')}</AlertTitle>
              <AlertDescription>{t('resendVerification.rateLimited')}</AlertDescription>
            </Alert>
          )}
          {submitted ? (
            <Alert data-testid="resend-verification-success-alert">
              <CheckCircle2Icon />
              <AlertTitle>{t('resendVerification.successTitle')}</AlertTitle>
              <AlertDescription>
                {t('resendVerification.successAlert')}
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
                    {isSubmitting ? t('resendVerification.submitting') : t('resendVerification.submit')}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
          <FieldDescription className="text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              {t('resendVerification.backToLogin')}
            </Link>
          </FieldDescription>
        </CardContent>
      </Card>
    </div>
  )
}
