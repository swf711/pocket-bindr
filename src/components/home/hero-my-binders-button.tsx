'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

// Client component on purpose: calling auth() on the server (as the old inline
// isLoggedIn check did) made the entire homepage dynamic, defeating ISR. Cost is the
// same as Header's isLoggedIn check — one extra /api/auth/session fetch per load.
// Renders nothing while the session is loading or when logged out; the button only
// ever appears as an addition next to "startSearch" (flex-wrap layout), so no
// skeleton is needed to avoid layout shift.
export function HeroMyBindersButton() {
  const t = useTranslations('home')
  const { status } = useSession()

  if (status !== 'authenticated') return null

  return (
    <Button variant="tertiary" size="lg" className="h-14 px-6 rounded-3xl" asChild>
      <Link href="/binders">{t('myBinders')}</Link>
    </Button>
  )
}
