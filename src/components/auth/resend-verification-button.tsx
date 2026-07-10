'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ResendVerificationButtonProps {
  email: string
  // login alert（destructive 語境）用 destructive；register 請查收信箱卡（非錯誤語境）用 secondary。
  variant?: 'destructive' | 'secondary'
}

// 共用於「請查收信箱」（註冊後）與登入被擋（EMAIL_NOT_VERIFIED）兩個入口。
// 一律回 200（防 enumeration，見 POST /api/auth/resend-verification），故成功狀態
// 不代表「這個 email 一定存在」，只代表請求已送出。
export function ResendVerificationButton({ email, variant = 'secondary' }: ResendVerificationButtonProps) {
  const t = useTranslations('verifySignup')
  const [sent, setSent] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleResend = async () => {
    setIsSending(true)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.status === 429) {
        toast.error(t('resendRateLimited'))
      } else {
        setSent(true)
        toast.success(t('resendSuccess'))
      }
    } catch {
      toast.error(t('resendFailed'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={isSending || sent}
      onClick={handleResend}
    >
      {sent ? t('resendSent') : isSending ? t('resending') : t('resend')}
    </Button>
  )
}
