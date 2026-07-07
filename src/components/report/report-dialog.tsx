'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { useForm, Controller, type FieldError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentActions,
  AttachmentAction,
} from '@/components/ui/attachment'
import {
  reportSchema,
  REPORT_TYPES,
  MAX_REPORT_ATTACHMENTS,
  MAX_REPORT_ATTACHMENT_TOTAL_BYTES,
  ALLOWED_REPORT_ATTACHMENT_TYPES,
  type ReportType,
  type ReportCardContext,
} from '@/lib/schemas/report'
import { resolveFieldError } from '@/lib/schemas/field-error'
import { resizeAndCompress } from '@/lib/image-compress'

const REPORT_ATTACHMENT_MAX_DIMENSION = 1280

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
  const [attachments, setAttachments] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  // 用 key 強制重掛載 file input 來清空選取檔案，避免在 handleSubmit callback 內讀寫 ref（React Compiler 會警告）
  const [inputKey, setInputKey] = useState(0)

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

  useEffect(() => {
    const urls = attachments.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [attachments])

  function resetAttachments() {
    setAttachments([])
    setInputKey((k) => k + 1)
  }

  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const invalid = files.find((f) => !ALLOWED_REPORT_ATTACHMENT_TYPES.has(f.type))
    if (invalid) {
      toast.error(t('attachInvalidType'))
      return
    }

    setAttachments((prev) => {
      const combined = [...prev, ...files]
      if (combined.length > MAX_REPORT_ATTACHMENTS) {
        toast.error(t('attachTooMany'))
        return combined.slice(0, MAX_REPORT_ATTACHMENTS)
      }
      return combined
    })
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      setIsCompressing(true)
      const compressed = await Promise.all(
        attachments.map((file) => resizeAndCompress(file, REPORT_ATTACHMENT_MAX_DIMENSION)),
      )
      setIsCompressing(false)

      const totalSize = compressed.reduce((sum, b) => sum + b.size, 0)
      if (totalSize > MAX_REPORT_ATTACHMENT_TOTAL_BYTES) {
        toast.error(t('attachTooLarge'))
        return
      }

      const formData = new FormData()
      formData.append('payload', JSON.stringify({ ...values, cardContext: defaultCardContext }))
      compressed.forEach((blob, i) => formData.append('attachments', blob, `attachment-${i + 1}.webp`))

      const res = await fetch('/api/report', { method: 'POST', body: formData })
      if (!res.ok) {
        toast.error(t('sendFailed'))
        return
      }
      toast(t('sendSuccess'))
      reset({ type: defaultType, message: '' })
      resetAttachments()
      setDialogOpen(false)
    } catch {
      setIsCompressing(false)
      toast.error(t('sendFailed'))
    }
  })

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(o) => {
        setDialogOpen(o)
        if (!o) {
          reset({ type: defaultType, message: '' })
          resetAttachments()
        }
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 min-w-0">
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
          <div className="space-y-1.5">
            <Label htmlFor="report-attachments">{t('attachLabel')}</Label>
            <Input
              key={inputKey}
              id="report-attachments"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={attachments.length >= MAX_REPORT_ATTACHMENTS}
              data-testid="report-attachment-input"
              onChange={handleAttachmentChange}
            />
            <p className="text-xs text-muted-foreground">{t('attachHint')}</p>
            {attachments.length > 0 && (
              <AttachmentGroup data-testid="report-attachment-list">
                {attachments.map((file, i) => (
                  <Attachment key={`${file.name}-${i}`} size="sm">
                    <AttachmentMedia variant="image">
                      {previewUrls[i] && <img src={previewUrls[i]} alt="" />}
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{file.name}</AttachmentTitle>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction
                        aria-label={t('attachRemove')}
                        onClick={() => removeAttachment(i)}
                      >
                        <X />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                ))}
              </AttachmentGroup>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" data-testid="report-submit-btn" disabled={isSubmitting || isCompressing}>
              {isSubmitting || isCompressing ? t('sending') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
