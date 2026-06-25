'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ForgotPasswordForm() {
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
          <CardTitle className="text-2xl">忘記密碼</CardTitle>
          <CardDescription>
            輸入您的 email，若有帳號將收到密碼重設連結
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rateLimited && (
            <Alert variant="destructive" data-testid="rate-limit-alert">
              <AlertDescription>請求過於頻繁，請稍後再試。</AlertDescription>
            </Alert>
          )}
          {submitted ? (
            <Alert data-testid="forgot-password-success-alert">
              <AlertDescription>
                若此 email 有帳號，您將在幾分鐘內收到重設信。請也確認垃圾郵件資料夾。
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
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
                    {loading ? '送出中...' : '送出重設連結'}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
          <FieldDescription className="text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              返回登入
            </Link>
          </FieldDescription>
        </CardContent>
      </Card>
    </div>
  )
}
