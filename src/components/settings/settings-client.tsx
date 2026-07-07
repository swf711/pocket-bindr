'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { UsernameForm } from './username-form'
import { AvatarForm } from './avatar-form'
import { PasswordForm } from './password-form'
import { SetPasswordForm } from './set-password-form'
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
  const tCommon = useTranslations('common')
  const displayUsername = username ?? email?.split('@')[0] ?? tCommon('defaultUsername')

  return (
    <div className="space-y-6">
      <Suspense>
        <SettingsToastHandler />
      </Suspense>

      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className='grid md:grid-cols-2 gap-4'>
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AvatarForm username={displayUsername} image={image} />
            <UsernameForm username={username} email={email} />
          </CardContent>
        </Card>

        {hasPassword && (
          <Card>
            <CardHeader>
              <CardTitle>{t('changePassword.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        )}

        {!hasPassword && email != null && (
          <Card>
            <CardHeader>
              <CardTitle>{t('setPassword.title')}</CardTitle>
              <CardDescription>{t('setPassword.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <SetPasswordForm />
            </CardContent>
          </Card>
        )}

        {!hasPassword && email == null && (
          <Card>
            <CardHeader>
              <CardTitle>{t('setPassword.title')}</CardTitle>
              <CardDescription>{t('setPassword.emailRequiredSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('setPassword.emailRequiredBody')}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('oauth.title')}</CardTitle>
            <CardDescription>{t('oauth.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <OAuthProvidersSection linkedProviders={linkedProviders} hasPassword={hasPassword} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tReport('title')}</CardTitle>
            <CardDescription>{tReport('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportDialog
              trigger={
                <Button variant="outline" data-testid="settings-report-trigger">
                  {tReport('trigger')}
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dangerZone.title')}</CardTitle>
            <CardDescription>{t('dangerZone.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountSection />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
