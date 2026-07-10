'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/auth/password-input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { consentChunks } from '@/components/auth/consent-chunks'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth'
import { resolveFieldError } from '@/lib/schemas/field-error'
import { ResendVerificationButton } from '@/components/auth/resend-verification-button'
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon } from 'lucide-react'

interface LoginFormProps {
  oauthError?: string
  accountDeleted?: boolean
  passwordReset?: boolean
}

export function LoginForm({ oauthError, accountDeleted, passwordReset }: LoginFormProps) {
  const router = useRouter()
  const t = useTranslations('auth')
  const tRoot = useTranslations()
  // Sign-in failure（帳密錯誤）無法歸到單一欄位，保留表單級錯誤。
  const [error, setError] = useState('')
  // EMAIL_NOT_VERIFIED（D1/D2：只作用於 credentials 登入）走專屬 Alert + 重寄入口，
  // 而非泛用的帳密錯誤訊息。next-auth signIn(redirect:false) 的 res.code 帶回
  // EmailNotVerifiedError 設定的自訂 code（見 src/lib/auth-utils.ts）。
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError('')
    setUnverifiedEmail(null)
    const res = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/cards' })
    if (res?.error) {
      if (res.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email)
      } else {
        setError(t('login.invalidCredentials'))
      }
    } else {
      router.push('/cards')
      router.refresh()
    }
  })

  const oauthMessage = oauthError
    ? (oauthError === 'OAuthAccountNotLinked'
      ? t('oauthErrors.OAuthAccountNotLinked')
      : t('login.genericOauthError'))
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
          <CardDescription>
            {t('login.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordReset && (
            <Alert data-testid="password-reset-alert">
              <CheckCircle2Icon />
              <AlertTitle>{t('login.passwordResetTitle')}</AlertTitle>
              <AlertDescription>{t('login.passwordResetAlert')}</AlertDescription>
            </Alert>
          )}
          {accountDeleted && (
            <Alert data-testid="account-deleted-alert">
              <InfoIcon />
              <AlertTitle>{t('login.accountDeletedTitle')}</AlertTitle>
              <AlertDescription>{t('login.accountDeletedAlert')}</AlertDescription>
            </Alert>
          )}
          {oauthMessage && (
            <Alert
              variant="destructive"
              data-testid="oauth-error-alert"
              className="bg-error-container text-error-foreground border-none"
            >
              <AlertCircleIcon />
              <AlertTitle>{t('login.oauthErrorTitle')}</AlertTitle>
              <AlertDescription>{oauthMessage}</AlertDescription>
            </Alert>
          )}
          {unverifiedEmail && (
            <Alert
              variant="destructive"
              data-testid="email-not-verified-alert"
              className="bg-error-container text-error-foreground border-none"
            >
              <AlertCircleIcon />
              <AlertTitle>{t('login.emailNotVerifiedTitle')}</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-2">
                <span>{t('login.emailNotVerified')}</span>
                <ResendVerificationButton email={unverifiedEmail} variant="destructive" />
              </AlertDescription>
            </Alert>
          )}
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
                      required
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [{ message: resolveFieldError(fieldState.error, tRoot) }] : undefined} />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="password">{t('password')}</FieldLabel>
                      <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                        {t('login.forgotPassword')}
                      </Link>
                    </div>
                    <PasswordInput
                      id="password"
                      autoComplete="current-password"
                      required
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [{ message: resolveFieldError(fieldState.error, tRoot) }] : undefined} />
                  </Field>
                )}
              />

              {error && (
                <p data-testid="login-error" className="text-sm text-destructive">{error}</p>
              )}

              <Field>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? t('login.submitting') : t('login.submit')}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-surface-container">
                {t('login.orLoginWith')}
              </FieldSeparator>

              <Field className="grid grid-cols-2 gap-4">
                <Button variant="outline" size="lg" type="button" className="bg-surface-container hover:bg-surface-container-highest" onClick={() => signIn('google', { callbackUrl: '/cards' })}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">{t('loginWithGoogle')}</span>
                </Button>

                <Button variant="outline" size="lg" type="button" className="bg-surface-container hover:bg-surface-container-highest" onClick={() => signIn('discord', { callbackUrl: '/cards' })}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                    <path
                      d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">{t('loginWithDiscord')}</span>
                </Button>
              </Field>

              <FieldDescription className="text-center">
                {t('login.noAccount')}
                <Link href="/register" className="text-primary underline-offset-4 hover:underline">
                  {t('login.registerLink')}
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        {t.rich('consentLogin', consentChunks)}
      </FieldDescription>
    </div>
  )
}
