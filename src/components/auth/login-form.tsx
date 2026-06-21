'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LoginFormProps {
  oauthError?: string
  accountDeleted?: boolean
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: '此 email 已有帳號但尚未綁定此社群帳號，請用原本方式登入後，到設定頁進行社群綁定。',
}

export function LoginForm({ oauthError, accountDeleted }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Email 或密碼錯誤')
    } else {
      router.push('/cards')
      router.refresh()
    }
  }

  const oauthMessage = oauthError
    ? (OAUTH_ERROR_MESSAGES[oauthError] ?? '登入時發生錯誤，請再試一次。')
    : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">登入</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {accountDeleted && (
          <Alert data-testid="account-deleted-alert">
            <AlertDescription>帳號已刪除，感謝您的使用。</AlertDescription>
          </Alert>
        )}
        {oauthMessage && (
          <Alert variant="destructive" data-testid="oauth-error-alert">
            <AlertDescription>{oauthMessage}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && (
            <p data-testid="login-error" className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '登入中...' : '登入'}
          </Button>
        </form>
        <Button variant="outline" className="w-full" onClick={() => signIn('google', { callbackUrl: '/cards' })}>
          使用 Google 登入
        </Button>
        <Button
          variant="outline"
          className="w-full"
          style={{ color: '#5865F2' }}
          onClick={() => signIn('discord', { callbackUrl: '/cards' })}
        >
          以 Discord 登入
        </Button>
        <p className="text-sm text-muted-foreground">
          還沒有帳號？
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            註冊
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
