'use client'

import { useEffect, useState } from 'react'
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
import { BinderSummary, PatchBinderResponse, GRID_SHORT_LABELS, GRID_TYPE_LABELS } from '@/types/binder'
import { DEFAULT_COVER_COLOR } from '@/lib/cover-colors'
import { CoverColorPicker } from './cover-color-picker'

interface EditBinderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  binder: BinderSummary | null
  onUpdated: (binder: BinderSummary) => void
}

export function EditBinderDialog({
  open,
  onOpenChange,
  binder,
  onUpdated,
}: EditBinderDialogProps) {
  const t = useTranslations('binderList.editDialog')
  const [name, setName] = useState('')
  const [gridType, setGridType] = useState<GridType>('grid_3x3')
  const [coverColor, setCoverColor] = useState(DEFAULT_COVER_COLOR)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (binder) {
      setName(binder.name)
      setGridType(binder.gridType as GridType)
      setCoverColor(binder.coverColor ?? DEFAULT_COVER_COLOR)
      setDescription(binder.description ?? '')
    }
  }, [binder])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!binder) return
    setLoading(true)
    try {
      const res = await fetch(`/api/binders/${binder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gridType, coverColor, description: description || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? t('updateFailed'))
      }
      const data: PatchBinderResponse = await res.json()
      if (data.affectedSlotsCount && data.affectedSlotsCount > 0) {
        toast(t('formatUpdated', { count: data.affectedSlotsCount }))
      }
      onUpdated(data as unknown as BinderSummary)
      onOpenChange(false)
    } catch (err) {
      toast((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="edit-binder-dialog" showCloseButton={false}>
        <DialogHeaderClose>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeaderClose>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-binder-name">{t('name')}</Label>
            <Input
              id="edit-binder-name"
              placeholder={t('namePlaceholder')}
              maxLength={50}
              value={name}
              onChange={e => setName(e.target.value)}
              data-testid="binder-name-input"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-binder-description">{t('description')}</Label>
            <Textarea
              id="edit-binder-description"
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
            data-testid="edit-binder-submit"
          >
            {loading ? t('saving') : t('save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
