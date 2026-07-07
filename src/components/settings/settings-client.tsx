'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { UsernameForm } from './username-form'
import { PasswordForm } from './password-form'
import { SetPasswordForm } from './set-password-form'
import { AddEmailForm } from './add-email-form'
import { OAuthProvidersSection } from './oauth-providers-section'
import { DeleteAccountSection } from './delete-account-section'
import { ReportDialog } from '@/components/report/report-dialog'
import { Button } from '@/components/ui/button'
import type { UserSettingsData } from '@/types/user'

function SettingsToastHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('settings')

  useEffect(() => {
    const LINK_ERROR_MESSAGES: Record<string, string> = {
      ALREADY_LINKED: t('linkErrors.ALREADY_LINKED'),
      PROVIDER_ACCOUNT_TAKEN: t('linkErrors.PROVIDER_ACCOUNT_TAKEN'),
      OAUTH_FAILED: t('linkErrors.OAUTH_FAILED'),
      INVALID_STATE: t('linkErrors.INVALID_STATE'),
    }
    const success = searchParams.get('link_success')
    const error = searchParams.get('link_error')
    if (success) {
      const label = success === 'google' ? 'Google' : 'Discord'
      toast(t('linkSuccess', { provider: label }))
      router.replace('/settings')
      router.refresh()
    } else if (error) {
      toast.error(LINK_ERROR_MESSAGES[error] ?? t('linkErrors.generic'))
      router.replace('/settings')
    }
  }, [searchParams, router, t])

  return null
}

export function SettingsClient({
  username,
  email,
  image,
  hasPassword,
  linkedProviders,
}: UserSettingsData) {
  const t = useTranslations('settings')
  const tReport = useTranslations('report')

  return (
    <div className="space-y-6">
      <Suspense>
        <SettingsToastHandler />
      </Suspense>

      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="columns-1 md:columns-2 gap-4 *:mb-4 *:break-inside-avoid">
        <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
          </CardHeader>
          <UsernameForm username={username} email={email} image={image} />
        </Card>

        {hasPassword && (
          <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
            <CardHeader>
              <CardTitle>{t('changePassword.title')}</CardTitle>
            </CardHeader>
            <PasswordForm />
          </Card>
        )}

        {!hasPassword && email != null && (
          <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
            <CardHeader>
              <CardTitle>{t('setPassword.title')}</CardTitle>
              <CardDescription>{t('setPassword.subtitle')}</CardDescription>
            </CardHeader>
            <SetPasswordForm />
          </Card>
        )}

        {!hasPassword && email == null && (
          <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
            <CardHeader>
              <CardTitle>{t('addEmail.title')}</CardTitle>
              <CardDescription>{t('addEmail.subtitle')}</CardDescription>
            </CardHeader>
            <AddEmailForm />
          </Card>
        )}

        <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
          <CardHeader>
            <CardTitle>{t('oauth.title')}</CardTitle>
            <CardDescription>{t('oauth.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <OAuthProvidersSection linkedProviders={linkedProviders} hasPassword={hasPassword} />
          </CardContent>
        </Card>

        <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
          <CardHeader>
            <CardTitle>{tReport('title')}</CardTitle>
            <CardDescription>{tReport('description')}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-end border-t-0 bg-transparent">
            <ReportDialog
              trigger={
                <Button variant="secondary" size="lg" data-testid="settings-report-trigger" className="rounded-full">
                  {tReport('trigger')}
                </Button>
              }
            />
          </CardFooter>
        </Card>

        <Card className="p-6 md:p-8 gap-7 bg-surface-container ring-0">
          <CardHeader>
            <CardTitle>{t('dangerZone.title')}</CardTitle>
            <CardDescription>{t('dangerZone.subtitle')}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-end border-t-0 bg-transparent">
            <DeleteAccountSection />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
