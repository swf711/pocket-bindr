'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { PasswordInput } from '@/components/auth/password-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { getPasswordStrength, isPasswordValid, MIN_PASSWORD_LENGTH } from '@/lib/password-policy'

const STRENGTH_COLORS = ['bg-destructive', 'bg-destructive', 'bg-yellow-500', 'bg-green-500'] as const

interface ResetPasswordFormProps {
  token?: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = getPasswordStrength(password)

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Alert variant="destructive" data-testid="reset-invalid-alert">
            <AlertDescription>連結無效，請重新申請。</AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link href="/forgot-password">重新申請重設連結</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid(password)) {
      setError(`密碼至少需 ${MIN_PASSWORD_LENGTH} 個字元`)
      return
    }
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    })
    setLoading(false)

    if (res.ok) {
      router.push('/login?reset=success')
      return
    }

    const data = await res.json() as { error?: string }
    if (data.error === 'TOKEN_EXPIRED') {
      setError('連結已過期，請重新申請。')
    } else if (data.error === 'TOKEN_INVALID') {
      setError('連結無效或已被使用，請重新申請。')
    } else if (data.error === 'INVALID_NEW_PASSWORD') {
      setError(`密碼至少需 ${MIN_PASSWORD_LENGTH} 個字元`)
    } else {
      setError('發生錯誤，請稍後再試。')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">設定新密碼</CardTitle>
          <CardDescription>請輸入您的新密碼，連結 15 分鐘內有效</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" data-testid="reset-error-alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-password">新密碼</FieldLabel>
                <PasswordInput
                  id="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {password.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <Progress
                      value={(strength.score / 3) * 100}
                      className={`h-1 [&>div]:${STRENGTH_COLORS[strength.score]}`}
                    />
                    <p className="text-xs text-muted-foreground">{strength.label}</p>
                  </div>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">確認密碼</FieldLabel>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? '設定中...' : '設定新密碼'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          {(error?.includes('過期') || error?.includes('無效')) && (
            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                重新申請重設連結
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
