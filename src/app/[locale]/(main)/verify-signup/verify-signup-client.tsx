'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircleIcon } from 'lucide-react'

type VerifyState = 'pending' | 'success' | 'expired' | 'invalid' | 'already_verified'

interface VerifySignupClientProps {
  token?: string
}

const ERROR_TO_STATE: Record<string, VerifyState> = {
  TOKEN_EXPIRED: 'expired',
  TOKEN_INVALID: 'invalid',
  ALREADY_VERIFIED: 'already_verified',
}

// 免登入呼叫 POST /api/auth/verify-signup（與 /verify-email 不同，不需 session）。
// 重放（ALREADY_VERIFIED）視為 no-op，顯示「已驗證，請登入」而非錯誤（D5）。
export function VerifySignupClient({ token }: VerifySignupClientProps) {
  const t = useTranslations('verifySignup')
  const [state, setState] = useState<VerifyState>(token ? 'pending' : 'invalid')

  useEffect(() => {
    if (!token) return

    let cancelled = false
    async function run() {
      try {
        const res = await fetch('/api/auth/verify-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (cancelled) return
        if (res.ok) {
          setState('success')
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

  if (state === 'success' || state === 'already_verified') {
    return (
      <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl" role="heading" aria-level={1}>
            {t(state === 'success' ? 'verifySuccess.title' : 'alreadyVerified.title')}
          </CardTitle>
          <CardDescription>
            {t(state === 'success' ? 'verifySuccess.subtitle' : 'alreadyVerified.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">{t('verifySuccess.goToLogin')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // expired / invalid：連結已無效。比照 reset-password 無 token 的失效卡——
  // 失效卡本身只負責「告知 + 導向重新申請」，重寄表單獨立成 /resend-verification 頁
  // （對應 reset-password → /forgot-password 的兩頁分離架構）。
  return (
    <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
      <CardContent className="space-y-4">
        <Alert variant="destructive" data-testid="verify-signup-error-alert" className="bg-error-container text-error-foreground border-none">
          <AlertCircleIcon />
          <AlertTitle>{t(`verifyErrorTitle.${state}`)}</AlertTitle>
          <AlertDescription>{t(`verifyError.${state}`)}</AlertDescription>
        </Alert>
        <Button asChild size="lg" className="w-full">
          <Link href="/resend-verification">{t('verifyError.goToResend')}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
