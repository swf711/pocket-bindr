'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type VerifyState = 'pending' | 'success' | 'expired' | 'invalid' | 'already_used' | 'forbidden'

interface VerifyEmailClientProps {
  token?: string
}

const ERROR_TO_STATE: Record<string, VerifyState> = {
  TOKEN_EXPIRED: 'expired',
  TOKEN_INVALID: 'invalid',
  EMAIL_ALREADY_USED: 'already_used',
  EMAIL_ALREADY_SET: 'already_used',
  FORBIDDEN: 'forbidden',
}

// Calls POST /api/user/email/verify on mount with the token from the query
// string. The endpoint itself re-checks session.user.id against the token's
// userId and re-checks email uniqueness inside a transaction (TOCTOU) — this
// component only renders whichever of the four outcomes comes back.
export function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const router = useRouter()
  const t = useTranslations('verifyEmail')
  const [state, setState] = useState<VerifyState>(token ? 'pending' : 'invalid')

  useEffect(() => {
    if (!token) return

    let cancelled = false
    async function run() {
      try {
        const res = await fetch('/api/user/email/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (cancelled) return
        if (res.ok) {
          setState('success')
          // Fired once here (not in a separate effect keyed on `state`/`t`):
          // `t` from useTranslations isn't referentially stable across
          // renders, and router.refresh() itself triggers a re-render —
          // combining them in a dependent effect caused an infinite
          // toast/refresh loop.
          toast.success(t('successToast'))
          router.refresh()
          return
        }
        const data = await res.json().catch(() => ({}))
        setState(ERROR_TO_STATE[data?.error as string] ?? 'invalid')
      } catch {
        if (!cancelled) setState('invalid')
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (state === 'pending') {
    return (
      <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('verifying')}</p>
        </CardContent>
      </Card>
    )
  }

  if (state === 'success') {
    return (
      <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl" role="heading" aria-level={1}>{t('success.title')}</CardTitle>
          <CardDescription>{t('success.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/settings">{t('success.backToSettings')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
      <CardContent className="space-y-4">
        <Alert variant="destructive" data-testid="verify-email-error-alert" className="bg-error-container text-error-foreground border-none">
          <AlertDescription>{t(`error.${state}`)}</AlertDescription>
        </Alert>
        <Button asChild size="lg" className="w-full">
          <Link href="/settings">{t('error.backToSettings')}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
