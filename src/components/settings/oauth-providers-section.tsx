'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '../ui/badge'
import { Item, ItemGroup, ItemMedia, ItemContent, ItemTitle, ItemActions } from '@/components/ui/item'
import { GoogleIcon, DiscordIcon } from '@/components/icons/provider-icons'

interface OAuthProvidersSectionProps {
  linkedProviders: string[]
  hasPassword: boolean
}

const PROVIDERS: { id: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'google', label: 'Google', icon: GoogleIcon },
  { id: 'discord', label: 'Discord', icon: DiscordIcon },
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
      toast.success(t('unlinked'))
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
    <ItemGroup className="gap-4">
      {PROVIDERS.map(({ id, label, icon: Icon }) => {
        const isLinked = linkedProviders.includes(id)
        const last = isLastMethod(id)
        return (
          <Item key={id} variant="outline">
            <ItemMedia variant="icon">
              <Icon className="size-4" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{label}</ItemTitle>
            </ItemContent>
            <ItemActions>
              {isLinked ? (
                <>
                  <Badge data-testid={`${id}-linked-badge`}>
                    {t('linkedBadge')}
                  </Badge>
                  <Button
                    variant="secondary"
                    size="lg"
                    data-testid={`${id}-unlink-btn`}
                    disabled={last}
                    title={last ? t('unlinkDisabledTitle') : undefined}
                    onClick={() => handleUnlink(id)}
                  >
                    {t('unlink')}
                  </Button>
                </>
              ) : (
                <Button
                  variant="tertiary"
                  size="lg"
                  data-testid={`${id}-link-btn`}
                  disabled={linkingProvider !== null}
                  onClick={() => handleLink(id)}
                >
                  {linkingProvider === id ? t('linking') : t('link')}
                </Button>
              )}
            </ItemActions>
          </Item>
        )
      })}
    </ItemGroup>
  )
}
