'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface OAuthProvidersSectionProps {
  linkedProviders: string[]
  hasPassword: boolean
}

const PROVIDERS: { id: string; label: string }[] = [
  { id: 'google', label: 'Google' },
  { id: 'discord', label: 'Discord' },
]

export function OAuthProvidersSection({ linkedProviders, hasPassword }: OAuthProvidersSectionProps) {
  const router = useRouter()
  const t = useTranslations('settings.oauth')
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null)

  function isLastMethod(provider: string) {
    return (
      linkedProviders.includes(provider) &&
      (hasPassword ? 1 : 0) + linkedProviders.length === 1
    )
  }

  async function handleUnlink(provider: string) {
    const res = await fetch(`/api/user/accounts/${provider}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
      toast(t('unlinked'))
    } else {
      const data = await res.json() as { error?: string }
      const msg =
        data.error === 'lastLoginMethodRemoval'
          ? t('unlinkLastMethodError')
          : t('unlinkFailed')
      toast.error(msg)
    }
  }

  async function handleLink(provider: string) {
    setLinkingProvider(provider)
    try {
      const res = await fetch(`/api/auth/link/${provider}/initiate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        toast.error(
          data.error === 'ALREADY_LINKED' ? t('alreadyLinked') : t('linkFailed')
        )
        setLinkingProvider(null)
        return
      }
      const { authUrl } = await res.json() as { authUrl: string }
      window.location.assign(authUrl)
      // 不 reset：頁面即將導離，維持 loading 狀態
    } catch {
      toast.error(t('linkFailed'))
      setLinkingProvider(null)
    }
  }

  return (
    <div className="space-y-4">
      {PROVIDERS.map(({ id, label }) => {
        const isLinked = linkedProviders.includes(id)
        const last = isLastMethod(id)
        return (
          <div key={id} className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            {isLinked ? (
              <div className="flex items-center gap-2">
                <span
                  data-testid={`${id}-linked-badge`}
                  className="text-sm text-muted-foreground"
                >
                  {t('linkedBadge')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid={`${id}-unlink-btn`}
                  disabled={last}
                  title={last ? t('unlinkDisabledTitle') : undefined}
                  onClick={() => handleUnlink(id)}
                >
                  {t('unlink')}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                data-testid={`${id}-link-btn`}
                disabled={linkingProvider !== null}
                onClick={() => handleLink(id)}
              >
                {linkingProvider === id ? t('linking') : t('link')}
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
