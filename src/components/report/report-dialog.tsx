'use client'

import { type ReactNode, useState } from 'react'
import { useForm, Controller, type FieldError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { reportSchema, REPORT_TYPES, type ReportType, type ReportCardContext } from '@/lib/schemas/report'
import { resolveFieldError } from '@/lib/schemas/field-error'

interface ReportDialogProps {
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultType?: ReportType
  defaultCardContext?: ReportCardContext
}

function renderError(error: FieldError | undefined, t: (key: string) => string) {
  if (!error) return undefined
  return resolveFieldError(error, t)
}

export function ReportDialog({
  trigger,
  open,
  onOpenChange,
  defaultType = 'bug',
  defaultCardContext,
}: ReportDialogProps) {
  const t = useTranslations('report')
  const tGlobal = useTranslations()
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<{ type: ReportType; message: string }>({
    resolver: zodResolver(reportSchema.omit({ cardContext: true })),
    defaultValues: { type: defaultType, message: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, cardContext: defaultCardContext }),
      })
      if (!res.ok) {
        toast.error(t('sendFailed'))
        return
      }
      toast(t('sendSuccess'))
      reset({ type: defaultType, message: '' })
      setDialogOpen(false)
    } catch {
      toast.error(t('sendFailed'))
    }
  })

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(o) => {
        setDialogOpen(o)
        if (!o) reset({ type: defaultType, message: '' })
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {defaultCardContext && (
            <p className="text-sm text-muted-foreground">
              {t('cardContextLabel')}：{defaultCardContext.cardName}（
              {defaultCardContext.setExternalId} {defaultCardContext.cardNumber}）
            </p>
          )}
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label htmlFor="report-type">{t('typeLabel')}</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="report-type" data-testid="report-type-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`types.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
          <Controller
            control={control}
            name="message"
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <Label htmlFor="report-message">{t('messageLabel')}</Label>
                <Textarea
                  id="report-message"
                  data-testid="report-message-input"
                  placeholder={t('messagePlaceholder')}
                  rows={5}
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.error && (
                  <p data-testid="report-message-error" className="text-sm text-destructive">
                    {renderError(fieldState.error, tGlobal)}
                  </p>
                )}
              </div>
            )}
          />
          <DialogFooter>
            <Button type="submit" data-testid="report-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? t('sending') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
