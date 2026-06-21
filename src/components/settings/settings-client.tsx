'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { UsernameForm } from './username-form'
import { PasswordForm } from './password-form'
import { OAuthProvidersSection } from './oauth-providers-section'
import { DeleteAccountSection } from './delete-account-section'
import type { UserSettingsData } from '@/types/user'

const LINK_ERROR_MESSAGES: Record<string, string> = {
  ALREADY_LINKED: '此社群帳號已連結至您的帳號',
  PROVIDER_ACCOUNT_TAKEN: '此社群帳號已被其他使用者使用',
  OAUTH_FAILED: '社群帳號驗證失敗，請再試一次',
  INVALID_STATE: '連結請求無效或已過期，請重試',
}

function SettingsToastHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const success = searchParams.get('link_success')
    const error = searchParams.get('link_error')
    if (success) {
      const label = success === 'google' ? 'Google' : 'Discord'
      toast(`已成功連結 ${label} 帳號`)
      router.replace('/settings')
      router.refresh()
    } else if (error) {
      toast.error(LINK_ERROR_MESSAGES[error] ?? '連結失敗，請再試一次')
      router.replace('/settings')
    }
  }, [searchParams, router])

  return null
}

export function SettingsClient({
  username,
  email,
  hasPassword,
  linkedProviders,
}: UserSettingsData) {
  return (
    <div className="max-w-lg space-y-6">
      <Suspense>
        <SettingsToastHandler />
      </Suspense>

      <h1 className="text-2xl font-bold">帳號設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>用戶名稱</CardTitle>
          <CardDescription>目前 Email：{email ?? '（未設定）'}</CardDescription>
        </CardHeader>
        <CardContent>
          <UsernameForm username={username} />
        </CardContent>
      </Card>

      {hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle>修改密碼</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>社群帳號</CardTitle>
          <CardDescription>綁定後可使用對應社群帳號登入</CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthProvidersSection linkedProviders={linkedProviders} hasPassword={hasPassword} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>危險區域</CardTitle>
          <CardDescription>刪除帳號後，所有資料將永久消失且無法復原</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountSection />
        </CardContent>
      </Card>
    </div>
  )
}
