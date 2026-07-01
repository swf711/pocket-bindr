'use client'

import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface GoogleLinkSectionProps {
  isGoogleLinked: boolean
}

export function GoogleLinkSection({ isGoogleLinked }: GoogleLinkSectionProps) {
  const t = useTranslations('settings.oauth')

  if (isGoogleLinked) {
    return (
      <p
        data-testid="google-linked-badge"
        className="text-sm text-muted-foreground"
      >
        {t('googleLinkedBadge')}
      </p>
    )
  }

  return (
    <Button
      variant="outline"
      data-testid="google-link-btn"
      onClick={() => signIn('google', { callbackUrl: '/settings' })}
    >
      {t('linkGoogle')}
    </Button>
  )
}
