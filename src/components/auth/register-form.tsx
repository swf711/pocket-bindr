'use client'

import { useState } from 'react'
import { useForm, Controller, type FieldError as RHFFieldError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ResendVerificationButton } from '@/components/auth/resend-verification-button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/auth/password-input'
import { Progress } from '@/components/ui/progress'
import { getPasswordStrength } from '@/lib/password-policy'
import { consentChunks } from '@/components/auth/consent-chunks'
import { registerSchema } from '@/lib/schemas/auth'
import { resolveFieldError } from '@/lib/schemas/field-error'

// 顯示欄位錯誤：client 端 zod 驗證錯誤（message 是 code）走 resolveFieldError
// 轉譯；API 回傳並經 setError 寫入的業務錯誤（type: 'server'）已是翻譯完成的文字，原樣顯示。
function fieldErrorMessage(
  error: RHFFieldError | undefined,
  t: (key: string) => string,
): string | undefined {
  if (!error) return undefined
  if (error.type === 'server') return error.message
  return resolveFieldError(error, t)
}

/**
 * 表單專用 schema：在共用 registerSchema 上疊加 confirmPassword 純前端比對。
 * confirmPassword 不進 registerSchema（server 端不需要也不接受這個欄位）。
 */
const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PASSWORD_MISMATCH',
        path: ['confirmPassword'],
      })
    }
  })

type RegisterFormValues = z.infer<typeof registerFormSchema>

export function RegisterForm() {
  const t = useTranslations('auth')
  const tVerify = useTranslations('verifySignup')
  const tRoot = useTranslations()
  // 無法歸到單一欄位的伺服器錯誤（INVALID_INPUT / SERVER_ERROR / generic）走表單級錯誤。
  const [error, setError] = useState('')
  // 註冊成功後不再自動登入（強制 email 驗證，見 CLAUDE.md）；改顯示「請查收信箱」狀態。
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  // 帳號已建立但驗證信寄送失敗（API 仍回 201 + emailSendFailed，見 register route）。
  const [emailSendFailed, setEmailSendFailed] = useState(false)
  const {
    control,
    handleSubmit,
    setError: setFieldError,
    watch,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', username: '', password: '', confirmPassword: '' },
  })

  const password = watch('password')
  const strength = getPasswordStrength(password)

  const onSubmit = handleSubmit(async ({ email, username, password }) => {
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    })

    const data = await res.json()

    if (!data.success) {
      const code = data.error as string
      // 可歸欄位的錯誤 inline 貼回該欄位；其餘走表單級錯誤。
      if (code === 'EMAIL_TAKEN' || code === 'DISPOSABLE_EMAIL' || code === 'INVALID_EMAIL_DOMAIN') {
        setFieldError('email', { type: 'server', message: t(`register.errors.${code}`) })
      } else if (code === 'USERNAME_TAKEN') {
        setFieldError('username', { type: 'server', message: t('register.errors.USERNAME_TAKEN') })
      } else if (['INVALID_INPUT', 'SERVER_ERROR'].includes(code)) {
        setError(t(`register.errors.${code}`))
      } else {
        setError(t('register.genericError'))
      }
      return
    }

    // 強制 email 驗證（D1）：註冊成功但需點驗證信連結才可登入，不自動登入。
    setEmailSendFailed(data.emailSendFailed === true)
    setRegisteredEmail(email)
  })

  if (registeredEmail) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" role="heading" aria-level={1}>
              {tVerify(emailSendFailed ? 'sendFailed.title' : 'checkEmail.title')}
            </CardTitle>
            <CardDescription>
              {emailSendFailed
                ? tVerify('sendFailed.subtitle', { email: registeredEmail })
                : tVerify('checkEmail.subtitle', { email: registeredEmail })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ResendVerificationButton email={registeredEmail} variant="secondary" />
            <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">
              {tVerify('checkEmail.backToLogin')}
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
          <CardDescription>
            {t('register.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    <FieldError>{fieldErrorMessage(fieldState.error, tRoot)}</FieldError>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="username"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor="username">{t('register.username')}</FieldLabel>
                    <Input
                      id="username"
                      type="text"
                      required
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError>{fieldErrorMessage(fieldState.error, tRoot)}</FieldError>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor="password">{t('password')}</FieldLabel>
                    <PasswordInput
                      id="password"
                      autoComplete="new-password"
                      required
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    {password.length > 0 && (
                      <div className="space-y-1" data-testid="password-strength">
                        <Progress value={((strength.score + 1) / 4) * 100} className="h-1.5" />
                        <FieldDescription>{t('strength.label', { level: t(`strength.${strength.score}`) })}</FieldDescription>
                      </div>
                    )}
                    <FieldError>{fieldErrorMessage(fieldState.error, tRoot)}</FieldError>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor="confirmPassword">{t('confirmPassword')}</FieldLabel>
                    <PasswordInput
                      id="confirmPassword"
                      autoComplete="new-password"
                      required
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError>{fieldErrorMessage(fieldState.error, tRoot)}</FieldError>
                  </Field>
                )}
              />

              {error && (
                <p data-testid="register-error" className="text-sm text-destructive">{error}</p>
              )}

              <Field>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? t('register.submitting') : t('register.submit')}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-surface-container">
                {t('register.orRegisterWith')}
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
                {t('register.haveAccount')}
                <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                  {t('register.loginLink')}
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        {t.rich('consentRegister', consentChunks)}
      </FieldDescription>
    </div>
  )
}
