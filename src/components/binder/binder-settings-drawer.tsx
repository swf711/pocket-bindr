'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { GridType } from '@prisma/client'
import { toast } from 'sonner'
import { Settings, Copy, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PILL_TABS_LIST, PILL_TABS_TRIGGER } from '@/lib/tabs-styles'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { IconTooltipButton } from '@/components/common/icon-tooltip-button'
import { CoverColorPicker } from '@/components/binders/cover-color-picker'
import { GRID_SHORT_LABELS, GRID_TYPE_LABELS, type SlotWithCard, type BinderSettings } from '@/types/binder'

interface BinderSettingsDrawerProps {
  binderId: string
  binderName: string
  binderDescription: string | null
  gridType: GridType
  coverColor: string
  totalPages: number
  shareToken: string | null
  onSettingsUpdate: (updated: {
    name: string
    gridType: GridType
    coverColor: string
    description?: string | null
    newSlots?: SlotWithCard[]
    newTotalPages?: number
  }) => void
  onShareTokenChange: (token: string | null) => void
}

export function BinderSettingsDrawer({
  binderId,
  binderName,
  binderDescription,
  gridType,
  coverColor,
  totalPages,
  shareToken: initialShareToken,
  onSettingsUpdate,
  onShareTokenChange,
}: BinderSettingsDrawerProps) {
  const t = useTranslations('binder.settingsDrawer')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(binderName)
  const [description, setDescription] = useState(binderDescription ?? '')
  const [localGridType, setLocalGridType] = useState<GridType>(gridType)
  const [localCoverColor, setLocalCoverColor] = useState(coverColor)
  const [savingSettings, setSavingSettings] = useState(false)
  const [localShareToken, setLocalShareToken] = useState<string | null>(initialShareToken)
  const [sharingLoading, setSharingLoading] = useState(false)

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/binders/${binderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gridType: localGridType,
          coverColor: localCoverColor,
          description: description || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? t('updateFailed'))
      }
      const data = await res.json()
      const affectedSlotsCount: number = data.affectedSlotsCount ?? 0

      if (affectedSlotsCount > 0) {
        const newTotalPages = (data.settings as BinderSettings | null)?.totalPages ?? totalPages
        const refreshRes = await fetch(`/api/binders/${binderId}`)
        const refreshData = await refreshRes.json()
        onSettingsUpdate({
          name,
          gridType: localGridType,
          coverColor: localCoverColor,
          description: description || null,
          newSlots: refreshData.slots,
          newTotalPages,
        })
        toast.success(t('formatUpdated', { count: affectedSlotsCount, from: totalPages + 1, to: newTotalPages }))
      } else {
        onSettingsUpdate({ name, gridType: localGridType, coverColor: localCoverColor, description: description || null })
        toast.success(t('settingsSaved'))
      }
    } catch {
      toast.error(t('settingsSaveFailed'))
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleEnableShare() {
    setSharingLoading(true)
    try {
      const res = await fetch(`/api/binders/${binderId}/share`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLocalShareToken(data.shareToken)
      onShareTokenChange(data.shareToken)
      toast.success(t('enableShareSuccess'))
    } catch {
      toast.error(t('enableShareFailed'))
    } finally {
      setSharingLoading(false)
    }
  }

  async function handleRevokeShare() {
    setSharingLoading(true)
    try {
      const res = await fetch(`/api/binders/${binderId}/share`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setLocalShareToken(null)
      onShareTokenChange(null)
      toast.success(t('revokeShareSuccess'))
    } catch {
      toast.error(t('revokeShareFailed'))
    } finally {
      setSharingLoading(false)
    }
  }

  async function handleCopyShareUrl() {
    if (!localShareToken) return
    const shareUrl = `${window.location.origin}/b/${localShareToken}`
    await navigator.clipboard.writeText(shareUrl)
    toast.success(t('linkCopied'))
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon-lg" data-testid="binder-settings-btn" aria-label={t('binderSettings')}>
              <Settings className="size-5" />
            </Button>
          </DrawerTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('binderSettings')}</p>
        </TooltipContent>
      </Tooltip>
      <DrawerContent className="h-full w-80 right-0 left-auto">
        <DrawerHeader>
          <div className="flex justify-between items-center">
            <DrawerTitle>{t('binderSettings')}</DrawerTitle>
            <DrawerClose>
              <X className="size-5" />
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="flex flex-col gap-6 p-4 overflow-y-auto">
          {/* 基本設定 */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="drawer-binder-name">{t('name')}</Label>
              <Input
                id="drawer-binder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                data-testid="drawer-binder-name-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="drawer-binder-description">{t('description')}</Label>
              <Textarea
                id="drawer-binder-description"
                placeholder={t('descriptionPlaceholder')}
                maxLength={150}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="drawer-binder-description-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t('format')}</Label>
              <Tabs
                value={localGridType}
                onValueChange={(v) => setLocalGridType(v as GridType)}
                data-testid="drawer-grid-tabs"
              >
                <TabsList className={cn(PILL_TABS_LIST, 'flex flex-wrap h-auto gap-1')}>
                  {(Object.keys(GRID_SHORT_LABELS) as GridType[]).map((gt) => (
                    <TabsTrigger
                      key={gt}
                      value={gt}
                      aria-label={GRID_TYPE_LABELS[gt]}
                      className={cn(PILL_TABS_TRIGGER, 'text-xs px-3')}
                    >
                      {GRID_SHORT_LABELS[gt]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t('coverColor')}</Label>
              <CoverColorPicker value={localCoverColor} onChange={setLocalCoverColor} />
            </div>

            <Button
              size="lg"
              onClick={handleSaveSettings}
              disabled={savingSettings || !name.trim()}
              data-testid="drawer-save-settings-btn"
            >
              {savingSettings ? t('saving') : t('saveSettings')}
            </Button>
          </div>

          <Separator />

          {/* 公開分享 */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Share2 className="size-4" />
              {t('publicShare')}
            </p>
            {localShareToken ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">{t('shareEnabledHint')}</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/b/${localShareToken}`}
                    className="font-mono text-xs h-8"
                    data-testid="drawer-share-url-input"
                  />
                  <IconTooltipButton
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopyShareUrl}
                    tooltip={t('copyLink')}
                    data-testid="drawer-copy-share-url-btn"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </IconTooltipButton>
                </div>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleRevokeShare}
                  disabled={sharingLoading}
                  data-testid="drawer-revoke-share-btn"
                >
                  {t('revokeShare')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">{t('shareDisabledHint')}</p>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleEnableShare}
                  disabled={sharingLoading}
                  data-testid="drawer-enable-share-btn"
                >
                  {t('enableShare')}
                </Button>
              </div>
            )}
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  )
}
