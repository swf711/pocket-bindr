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
import { GoogleLinkSection } from './google-link-section'
import type { UserSettingsData } from '@/types/user'

export function SettingsClient({
  username,
  email,
  hasPassword,
  isGoogleLinked,
}: UserSettingsData) {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">帳號設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>用戶名稱</CardTitle>
          <CardDescription>目前 Email：{email}</CardDescription>
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
          <CardTitle>Google 帳號</CardTitle>
          <CardDescription>
            連結後可使用 Google 登入同一帳號
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleLinkSection isGoogleLinked={isGoogleLinked} />
        </CardContent>
      </Card>
    </div>
  )
}
