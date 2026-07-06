'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/password-input'
import { Progress } from '@/components/ui/progress'
import { FieldDescription } from '@/components/ui/field'
import { getPasswordStrength } from '@/lib/password-policy'
import { setPasswordSchema } from '@/lib/schemas/user'
import { resolveFieldError } from '@/lib/schemas/field-error'

// confirmPassword 純前端比對，不送入 API，也不動 Dev Agent 1 建的共用
// server schema（setPasswordSchema）；newPassword 的硬性規則仍重用
// setPasswordSchema.shape.newPassword（passwordSchema），避免規則漂移。
// 沿用原本 UX：不論是密碼太短還是兩次輸入不一致，都只在
// confirmPassword 欄位下方顯示單一錯誤訊息（data-testid="set-password-error"）。
const setPasswordFormSchema = z
  .object({
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const result = setPasswordSchema.shape.newPassword.safeParse(data.newPassword)
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: result.error.issues[0]?.message ?? 'PASSWORD_TOO_SHORT',
      })
      return
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'PASSWORD_MISMATCH',
      })
    }
  })

type SetPasswordFormValues = z.infer<typeof setPasswordFormSchema>

// Lets a pure-OAuth user (no existing password) set one as a login escape
// hatch. No current-password field; "confirm password" is a front-end only
// check (not sent to the API), mirroring the register form.
export function SetPasswordForm() {
  const router = useRouter()
  const t = useTranslations('settings.setPassword')
  const tAuth = useTranslations('auth')
  const tGlobal = useTranslations()
  const {
    control,
    handleSubmit,
    setError,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const newPassword = watch('newPassword')
  const strength = getPasswordStrength(newPassword)

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: values.newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.error === 'INVALID_NEW_PASSWORD') {
          setError('confirmPassword', {
            type: 'server',
            message: resolveFieldError({ message: 'PASSWORD_TOO_SHORT' }, tGlobal),
          })
        } else {
          toast.error(t('setFailed'))
        }
        return
      }
      toast(t('setSuccess'))
      reset({ newPassword: '', confirmPassword: '' })
      router.refresh()
    } catch {
      toast.error(t('setFailed'))
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Controller
        control={control}
        name="newPassword"
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <Label htmlFor="set-password">{t('newPasswordLabel')}</Label>
            <PasswordInput
              id="set-password"
              data-testid="set-password-input"
              aria-invalid={fieldState.invalid}
              placeholder={t('newPasswordPlaceholder')}
              autoComplete="new-password"
              {...field}
            />
            {newPassword.length > 0 && (
              <div className="space-y-1" data-testid="set-password-strength">
                <Progress value={((strength.score + 1) / 4) * 100} className="h-1.5" />
                <FieldDescription>{tAuth('strength.label', { level: tAuth(`strength.${strength.score}`) })}</FieldDescription>
              </div>
            )}
          </div>
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <Label htmlFor="set-password-confirm">{t('confirmPasswordLabel')}</Label>
            <PasswordInput
              id="set-password-confirm"
              data-testid="set-password-confirm-input"
              aria-invalid={fieldState.invalid}
              autoComplete="new-password"
              {...field}
            />
            {fieldState.error && (
              <p data-testid="set-password-error" className="text-sm text-destructive">
                {fieldState.error.type === 'server'
                  ? fieldState.error.message
                  : resolveFieldError(fieldState.error, tGlobal)}
              </p>
            )}
          </div>
        )}
      />
      <Button type="submit" data-testid="save-set-password-btn" disabled={isSubmitting}>
        {isSubmitting ? t('setting') : t('submit')}
      </Button>
    </form>
  )
}
