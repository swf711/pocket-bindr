'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UsernameFormProps {
  username: string | null
  email: string | null
}

export function UsernameForm({ username, email }: UsernameFormProps) {
  const t = useTranslations('settings.profile')
  const [value, setValue] = useState(username ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/user/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.error === 'USERNAME_TAKEN') {
          setError(t('usernameTaken'))
        } else if (data?.error === 'INVALID_USERNAME') {
          setError(t('usernameInvalid'))
        } else {
          toast.error(t('updateFailed'))
        }
        return
      }
      toast(t('updateSuccess'))
    } catch {
      toast.error(t('updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
      <div className="space-y-1.5">
        <Label htmlFor="username">{t('usernameLabel')}</Label>
        <Input
          id="username"
          data-testid="username-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          placeholder={t('usernamePlaceholder')}
          maxLength={20}
        />
        {error && (
          <p data-testid="username-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button
        type="submit"
        data-testid="save-username-btn"
        disabled={loading}
      >
        {loading ? t('saving') : t('save')}
      </Button>
    </form>
  )
}
