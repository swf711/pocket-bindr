'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UsernameFormProps {
  username: string | null
  email: string | null
}

export function UsernameForm({ username, email }: UsernameFormProps) {
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
          setError('此用戶名稱已被使用')
        } else if (data?.error === 'INVALID_USERNAME') {
          setError('用戶名稱格式不正確（3–20 字元，英數字、_ 或 -）')
        } else {
          toast.error('更新失敗')
        }
        return
      }
      toast('更新成功')
    } catch {
      toast.error('更新失敗')
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
          placeholder="（未設定）"
          disabled
          readOnly
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="username">用戶名稱</Label>
        <Input
          id="username"
          data-testid="username-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          placeholder="3–20 字元，英數字、_ 或 -"
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
        {loading ? '更新中…' : '儲存'}
      </Button>
    </form>
  )
}
