'use client'

import { useForm, Controller, type FieldError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usernameSchema } from '@/lib/schemas/user'
import { resolveFieldError } from '@/lib/schemas/field-error'
import { AvatarForm } from './avatar-form'

const usernameFormSchema = z.object({
  username: usernameSchema,
})

type UsernameFormValues = z.infer<typeof usernameFormSchema>

interface UsernameFormProps {
  username: string | null
  email: string | null
  image: string | null
}

// 顯示欄位錯誤：client 端 zod 驗證錯誤（message 是 code）走 resolveFieldError
// 轉譯；API 回傳的業務邏輯錯誤（usernameTaken/usernameInvalid）以 setError
// 直接寫入已翻譯完成的文字，原樣顯示（沿用原本 UX）。
function renderUsernameError(
  error: FieldError | undefined,
  t: (key: string) => string,
) {
  if (!error) return undefined
  if (error.type === 'server') return error.message
  return resolveFieldError(error, t)
}

export function UsernameForm({ username, email, image }: UsernameFormProps) {
  const t = useTranslations('settings.profile')
  const tGlobal = useTranslations()
  const tCommon = useTranslations('common')
  const { update } = useSession()
  const router = useRouter()
  const displayUsername = username ?? email?.split('@')[0] ?? tCommon('defaultUsername')
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: { username: username ?? '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/user/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: values.username }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.error === 'USERNAME_TAKEN') {
          setError('username', { type: 'server', message: t('usernameTaken') })
        } else if (data?.error === 'INVALID_USERNAME') {
          setError('username', { type: 'server', message: t('usernameInvalid') })
        } else {
          toast.error(t('updateFailed'))
        }
        return
      }
      const data = await res.json()
      await update({ name: data.username })
      router.refresh()
      toast.success(t('updateSuccess'))
    } catch {
      toast.error(t('updateFailed'))
    }
  })

  return (
    <form onSubmit={onSubmit}>
      <CardContent className="space-y-4">
        <AvatarForm username={displayUsername} image={image} />
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            data-testid="email-input"
            value={email ?? ''}
            placeholder={t('emailNotSet')}
            disabled
            readOnly
          />
        </div>
        <Controller
          control={control}
          name="username"
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label htmlFor="username">{t('usernameLabel')}</Label>
              <Input
                id="username"
                data-testid="username-input"
                aria-invalid={fieldState.invalid}
                placeholder={t('usernamePlaceholder')}
                maxLength={20}
                {...field}
              />
              {fieldState.error && (
                <p data-testid="username-error" className="text-sm text-destructive">
                  {renderUsernameError(fieldState.error, tGlobal)}
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
          data-testid="save-username-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('saving') : t('save')}
        </Button>
      </CardFooter>
    </form>
  )
}
