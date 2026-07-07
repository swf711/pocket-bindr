'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { addEmailSchema, type AddEmailInput } from '@/lib/schemas/user'
import { resolveFieldError } from '@/lib/schemas/field-error'

// Lets a pure-OAuth user (User.email === null) request adding an email. On
// success a verification link is sent; User.email is only written once the
// user visits /verify-email and confirms ownership (see verify-email-client).
export function AddEmailForm() {
  const t = useTranslations('settings.addEmail')
  const tGlobal = useTranslations()
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { isSubmitting },
  } = useForm<AddEmailInput>({
    resolver: zodResolver(addEmailSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/user/email/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.error === 'EMAIL_ALREADY_USED' || data?.error === 'INVALID_EMAIL') {
          setError('email', {
            type: 'server',
            message: resolveFieldError({ message: data.error }, tGlobal),
          })
        } else {
          toast.error(t('requestFailed'))
        }
        return
      }
      toast(t('requestSuccess'))
      reset({ email: '' })
    } catch {
      toast.error(t('requestFailed'))
    }
  })

  return (
    <form onSubmit={onSubmit}>
      <CardContent className="space-y-3">
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label htmlFor="add-email">{t('emailLabel')}</Label>
              <Input
                id="add-email"
                type="email"
                data-testid="add-email-input"
                aria-invalid={fieldState.invalid}
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
                {...field}
              />
              {fieldState.error && (
                <p data-testid="add-email-error" className="text-sm text-destructive">
                  {fieldState.error.type === 'server'
                    ? fieldState.error.message
                    : resolveFieldError(fieldState.error, tGlobal)}
                </p>
              )}
            </div>
          )}
        />
      </CardContent>
      <CardFooter className="justify-end border-t-0 bg-transparent">
        <Button size="lg" type="submit" data-testid="save-add-email-btn" disabled={isSubmitting}>
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </CardFooter>
    </form>
  )
}
