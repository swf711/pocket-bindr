'use client'

import { useState } from 'react'
import { Copy, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
      toast('已啟用公開分享')
    } catch {
      toast.error('啟用失敗，請再試一次')
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
      toast('已撤銷公開分享')
    } catch {
      toast.error('撤銷失敗，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl)
    toast('已複製連結')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            公開分享卡冊
          </DialogTitle>
          <DialogDescription>
            {token
              ? '任何持有此連結的人皆可瀏覽（純唯讀，無法編輯）'
              : '啟用後產生公開連結，任何人皆可瀏覽此卡冊（純唯讀）'}
          </DialogDescription>
        </DialogHeader>

        {token ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>公開連結</Label>
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
                  aria-label="複製連結"
                  data-testid="copy-share-url-btn"
                >
                  <Copy className="h-4 w-4" />
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
              撤銷分享
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleEnable}
            disabled={loading}
            data-testid="enable-share-btn"
          >
            啟用公開分享
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
