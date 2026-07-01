'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ForgotPasswordForm() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setRateLimited(false)

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setLoading(false)

    if (res.status === 429) {
      setRateLimited(true)
      return
    }

    setSubmitted(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('forgot.title')}</CardTitle>
          <CardDescription>
            {t('forgot.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rateLimited && (
            <Alert variant="destructive" data-testid="rate-limit-alert">
              <AlertDescription>{t('forgot.rateLimited')}</AlertDescription>
            </Alert>
          )}
          {submitted ? (
            <Alert data-testid="forgot-password-success-alert">
              <AlertDescription>
                {t('forgot.successAlert')}
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">{t('email')}</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? t('forgot.submitting') : t('forgot.submit')}
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
