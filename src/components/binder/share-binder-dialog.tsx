'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { DialogHeaderClose } from '@/components/common/dialog-header-close'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ShareBinderDialogProps {
  binderId: string
  initialToken: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTokenChange: (token: string | null) => void
}

export function ShareBinderDialog({
  binderId,
  initialToken,
  open,
  onOpenChange,
  onTokenChange,
}: ShareBinderDialogProps) {
  const t = useTranslations('binder.shareDialog')
  const [token, setToken] = useState<string | null>(initialToken)
  const [loading, setLoading] = useState(false)

  const shareUrl = token ? `${window.location.origin}/b/${token}` : ''

  async function handleEnable() {
    setLoading(true)
    try {
      const res = await fetch(`/api/binders/${binderId}/share`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setToken(data.shareToken)
      onTokenChange(data.shareToken)
      toast(t('enableSuccess'))
    } catch {
      toast.error(t('enableFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke() {
    setLoading(true)
    try {
      const res = await fetch(`/api/binders/${binderId}/share`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setToken(null)
      onTokenChange(null)
      toast(t('revokeSuccess'))
    } catch {
      toast.error(t('revokeFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl)
    toast(t('linkCopied'))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeaderClose
          description={
            <DialogDescription>
              {token ? t('descriptionEnabled') : t('descriptionDisabled')}
            </DialogDescription>
          }
        >
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-4" />
            {t('title')}
          </DialogTitle>
        </DialogHeaderClose>

        {token ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('publicLink')}</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-xs"
                  data-testid="share-url-input"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  aria-label={t('copyLink')}
                  data-testid="copy-share-url-btn"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={handleRevoke}
              disabled={loading}
              data-testid="revoke-share-btn"
            >
              {t('revokeShare')}
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleEnable}
            disabled={loading}
            data-testid="enable-share-btn"
          >
            {t('enableShare')}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
