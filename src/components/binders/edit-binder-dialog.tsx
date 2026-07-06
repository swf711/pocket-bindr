'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { binderUpdateSchema, type BinderUpdateInput } from '@/lib/schemas/binder'
import { resolveFieldError } from '@/lib/schemas/field-error'
import { Field, FieldError } from '@/components/ui/field'
import type { z } from 'zod'

interface EditBinderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  binder: BinderSummary | null
  onUpdated: (binder: BinderSummary) => void
}

/** zod schema 對 description 有 transform，表單值型別（輸入） ≠ handleSubmit 收到的型別（輸出，見 BinderUpdateInput） */
type EditBinderFormValues = z.input<typeof binderUpdateSchema>

export function EditBinderDialog({
  open,
  onOpenChange,
  binder,
  onUpdated,
}: EditBinderDialogProps) {
  const t = useTranslations('binderList.editDialog')
  const tValidation = useTranslations('validation')
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<EditBinderFormValues, unknown, BinderUpdateInput>({
    resolver: zodResolver(binderUpdateSchema),
    defaultValues: {
      name: '',
      gridType: 'grid_3x3',
      coverColor: DEFAULT_COVER_COLOR,
      description: '',
    },
  })

  useEffect(() => {
    if (binder) {
      reset({
        name: binder.name,
        gridType: binder.gridType as GridType,
        coverColor: binder.coverColor ?? DEFAULT_COVER_COLOR,
        description: binder.description ?? '',
      })
    }
  }, [binder, reset])

  const onSubmit = handleSubmit(async (values) => {
    if (!binder) return
    try {
      const res = await fetch(`/api/binders/${binder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="edit-binder-dialog" showCloseButton={false}>
        <DialogHeaderClose>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeaderClose>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-2">
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="edit-binder-name">{t('name')}</Label>
                <Input
                  id="edit-binder-name"
                  placeholder={t('namePlaceholder')}
                  maxLength={50}
                  aria-invalid={fieldState.invalid}
                  data-testid="binder-name-input"
                  {...field}
                  value={field.value ?? ''}
                />
                <FieldError>{fieldState.error && resolveFieldError(fieldState.error, tValidation)}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="edit-binder-description">{t('description')}</Label>
                <Textarea
                  id="edit-binder-description"
                  placeholder={t('descriptionPlaceholder')}
                  maxLength={150}
                  rows={2}
                  aria-invalid={fieldState.invalid}
                  data-testid="binder-description-input"
                  {...field}
                  value={field.value ?? ''}
                />
                <FieldError>{fieldState.error && resolveFieldError(fieldState.error, tValidation)}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="gridType"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label>{t('format')}</Label>
                <Tabs
                  value={field.value}
                  onValueChange={field.onChange}
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
                <FieldError>{fieldState.error && resolveFieldError(fieldState.error, tValidation)}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="coverColor"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label>{t('coverColor')}</Label>
                <CoverColorPicker value={field.value ?? DEFAULT_COVER_COLOR} onChange={field.onChange} />
                <FieldError>{fieldState.error && resolveFieldError(fieldState.error, tValidation)}</FieldError>
              </Field>
            )}
          />
          <Button
            size="lg"
            type="submit"
            disabled={isSubmitting}
            data-testid="edit-binder-submit"
          >
            {isSubmitting ? t('saving') : t('save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
