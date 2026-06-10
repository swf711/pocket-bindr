'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const errorMessages: Record<string, string> = {
  EMAIL_TAKEN: '此 Email 已被使用',
  USERNAME_TAKEN: '此使用者名稱已被使用',
  INVALID_INPUT: '請填寫所有欄位',
  SERVER_ERROR: '伺服器錯誤，請稍後再試',
}

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    })

    const data = await res.json()

    if (!data.success) {
      setError(errorMessages[data.error] ?? '註冊失敗')
      setLoading(false)
      return
    }

    await signIn('credentials', { email, password, redirect: false })
    router.push('/cards')
    router.refresh()
  }

  return (
    <div className="mx-auto mt-20 w-full max-w-md px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">註冊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">使用者名稱</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '註冊中...' : '註冊'}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            已有帳號？
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              登入
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
