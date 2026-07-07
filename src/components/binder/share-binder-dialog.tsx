'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from '../ui/alert-dialog'

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-primary-container text-on-primary-container">
            <Share2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {token ? t('descriptionEnabled') : t('descriptionDisabled')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {token ? (
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
                variant="secondary"
                size="icon"
                onClick={handleCopy}
                aria-label={t('copyLink')}
                data-testid="copy-share-url-btn"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="lg" disabled={loading} className="rounded-full!">
            {t('cancel')}
          </AlertDialogCancel>
          {token ? (
            <Button
              variant="destructive"
              size="lg"
              onClick={handleRevoke}
              disabled={loading}
              data-testid="revoke-share-btn"
            >
              {t('revokeShare')}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleEnable}
              disabled={loading}
              data-testid="enable-share-btn"
            >
              {t('enableShare')}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
