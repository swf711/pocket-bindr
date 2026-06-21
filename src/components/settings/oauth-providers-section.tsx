'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
      toast('已解除連結')
    } else {
      const data = await res.json() as { error?: string }
      const msg =
        data.error === 'lastLoginMethodRemoval'
          ? '無法解綁：這是您唯一的登入方式'
          : '解除連結失敗，請再試一次'
      toast.error(msg)
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
                  ✓ 已連結
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid={`${id}-unlink-btn`}
                  disabled={last}
                  title={last ? '這是您目前唯一的登入方式，無法解綁' : undefined}
                  onClick={() => handleUnlink(id)}
                >
                  解綁
                </Button>
              </div>
            ) : (
              <span
                data-testid={`${id}-not-linked`}
                className="text-sm text-muted-foreground"
              >
                未綁定
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
