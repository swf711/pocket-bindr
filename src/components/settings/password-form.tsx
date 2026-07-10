'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/password-input'
import { Progress } from '@/components/ui/progress'
import { FieldDescription } from '@/components/ui/field'
import { getPasswordStrength } from '@/lib/password-policy'
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/schemas/user'
import { resolveFieldError } from '@/lib/schemas/field-error'

export function PasswordForm() {
  const t = useTranslations('settings.changePassword')
  const tAuth = useTranslations('auth')
  const tGlobal = useTranslations()
  const {
    control,
    handleSubmit,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  })

  const newPassword = watch('newPassword')
  const strength = getPasswordStrength(newPassword)

  // 沿用原本 UX：不論是目前密碼錯誤還是新密碼不合格，都只顯示單一錯誤訊息
  // （data-testid="password-error"）；currentPassword 優先於 newPassword。
  const combinedError = errors.currentPassword ?? errors.newPassword

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.error === 'WRONG_PASSWORD') {
          setError('currentPassword', { type: 'server', message: t('wrongPassword') })
        } else if (data?.error === 'INVALID_NEW_PASSWORD') {
          setError('newPassword', { type: 'server', message: t('newPasswordTooShort') })
        } else {
          toast.error(t('updateFailed'))
        }
        return
      }
      toast.success(t('updateSuccess'))
      reset({ currentPassword: '', newPassword: '' })
    } catch {
      toast.error(t('updateFailed'))
    }
  })

  return (
    <form onSubmit={onSubmit}>
      <CardContent className="space-y-3">
        <Controller
          control={control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label htmlFor="current-password">{t('currentPasswordLabel')}</Label>
              <PasswordInput
                id="current-password"
                data-testid="current-password-input"
                aria-invalid={fieldState.invalid}
                autoComplete="current-password"
                {...field}
              />
            </div>
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t('newPasswordLabel')}</Label>
              <PasswordInput
                id="new-password"
                data-testid="new-password-input"
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                placeholder={t('newPasswordPlaceholder')}
                {...field}
              />
              {newPassword.length > 0 && (
                <div className="space-y-1" data-testid="password-strength">
                  <Progress value={((strength.score + 1) / 4) * 100} className="h-1.5" />
                  <FieldDescription>{tAuth('strength.label', { level: tAuth(`strength.${strength.score}`) })}</FieldDescription>
                </div>
              )}
              {combinedError && (
                <p data-testid="password-error" className="text-sm text-destructive">
                  {combinedError.type === 'server'
                    ? combinedError.message
                    : resolveFieldError(combinedError, tGlobal)}
                </p>
              )}
            </div>
          )}
        />
      </CardContent>
      <CardFooter className="justify-end border-t-0 bg-transparent">
        <Button
          size="lg"
          type="submit"
          data-testid="save-password-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('updating') : t('submit')}
        </Button>
      </CardFooter>
    </form>
  )
}
