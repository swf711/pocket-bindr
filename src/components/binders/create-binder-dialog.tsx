'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { GridType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { DialogHeaderClose } from '@/components/common/dialog-header-close'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PILL_TABS_LIST, PILL_TABS_TRIGGER } from '@/lib/tabs-styles'
import { cn } from '@/lib/utils'
import { BinderSummary, GRID_SHORT_LABELS, GRID_TYPE_LABELS } from '@/types/binder'
import { DEFAULT_COVER_COLOR } from '@/lib/cover-colors'
import { CoverColorPicker } from './cover-color-picker'

interface CreateBinderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (binder: BinderSummary) => void
}

export function CreateBinderDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateBinderDialogProps) {
  const t = useTranslations('binderList.createDialog')
  const [name, setName] = useState('')
  const [gridType, setGridType] = useState<GridType>('grid_3x3')
  const [coverColor, setCoverColor] = useState(DEFAULT_COVER_COLOR)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/binders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gridType, coverColor, description: description || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 409 && err?.error === 'binderLimitReached') {
          toast.error(t('limitReached', { max: err.max }))
          return
        }
        throw new Error(err?.error ?? t('createFailed'))
      }
      const data: BinderSummary = await res.json()
      onCreated(data)
      setName('')
      setGridType('grid_3x3')
      setCoverColor(DEFAULT_COVER_COLOR)
      setDescription('')
      onOpenChange(false)
    } catch (err) {
      toast((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeaderClose>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeaderClose>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="binder-name">{t('name')}</Label>
            <Input
              id="binder-name"
              placeholder={t('namePlaceholder')}
              maxLength={50}
              value={name}
              onChange={e => setName(e.target.value)}
              data-testid="binder-name-input"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="binder-description">{t('description')}</Label>
            <Textarea
              id="binder-description"
              placeholder={t('descriptionPlaceholder')}
              maxLength={150}
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              data-testid="binder-description-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('format')}</Label>
            <Tabs
              value={gridType}
              onValueChange={v => setGridType(v as GridType)}
              data-testid="binder-grid-tabs"
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
            <CoverColorPicker value={coverColor} onChange={setCoverColor} />
          </div>
          <Button
            type="submit"
            disabled={loading}
            data-testid="create-binder-submit"
          >
            {loading ? t('creating') : t('create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
