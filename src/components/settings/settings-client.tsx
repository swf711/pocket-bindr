'use client'

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

export function SettingsClient({
  username,
  email,
  hasPassword,
  linkedProviders,
}: UserSettingsData) {
  return (
    <div className="max-w-lg space-y-6">
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
