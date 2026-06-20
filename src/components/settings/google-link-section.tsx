'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface GoogleLinkSectionProps {
  isGoogleLinked: boolean
}

export function GoogleLinkSection({ isGoogleLinked }: GoogleLinkSectionProps) {
  if (isGoogleLinked) {
    return (
      <p
        data-testid="google-linked-badge"
        className="text-sm text-muted-foreground"
      >
        ✓ 已連結 Google 帳號
      </p>
    )
  }

  return (
    <Button
      variant="outline"
      data-testid="google-link-btn"
      onClick={() => signIn('google', { callbackUrl: '/settings' })}
    >
      連結 Google 帳號
    </Button>
  )
}
