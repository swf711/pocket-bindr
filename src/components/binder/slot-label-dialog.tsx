'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { DialogHeaderClose } from '@/components/common/dialog-header-close'
import { TagInput } from '@/components/common/tag-input'
import { Label } from '@/components/ui/label'
import { Field, FieldError } from '@/components/ui/field'
import { resolveFieldError } from '@/lib/schemas/field-error'
import { slotLabelsSchema } from '@/lib/schemas/binder'
import { MAX_SLOT_LABELS, MAX_SLOT_LABEL_LENGTH } from '@/lib/binder-limits'
import type { SlotWithCard } from '@/types/binder'

/** 重複標籤提示的顯示時間（ms），與 TagInput 的 chip 閃爍同步淡出 */
const DUPLICATE_HINT_DURATION = 1200

/** schema 對 labels 有 transform，表單輸入型別 ≠ handleSubmit 收到的輸出型別 */
type SlotLabelFormValues = z.input<typeof slotLabelsSchema>

interface SlotLabelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: SlotWithCard | null
  /** 送出後由呼叫端負責樂觀更新 + API；空陣列代表清除全部標籤 */
  onSubmit: (labels: string[]) => void | Promise<void>
}

export function SlotLabelDialog({ open, onOpenChange, slot, onSubmit }: SlotLabelDialogProps) {
  const t = useTranslations('binder.slotCard')
  const tGlobal = useTranslations()
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<SlotLabelFormValues, unknown, z.output<typeof slotLabelsSchema>>({
    resolver: zodResolver(slotLabelsSchema),
    defaultValues: { labels: [] },
  })

  // 「清除全部」看的是**當前編輯中的值**而非 DB 已存值，按鈕狀態才會與眼前畫面一致。
  // 用 useWatch 而非 watch()——後者回傳函式，React Compiler 無法安全 memo 化（lint 會擋）。
  const currentLabels = useWatch({ control, name: 'labels' }) ?? []

  /** 剛被判定重複的標籤，用於顯示提示；TagInput 那邊會同時閃爍既有的那顆 chip */
  const [duplicateTag, setDuplicateTag] = useState<string | null>(null)
  const duplicateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearDuplicateTimer = () => {
    if (duplicateTimer.current) clearTimeout(duplicateTimer.current)
  }

  useEffect(() => clearDuplicateTimer, [])

  const handleDuplicate = (tag: string) => {
    clearDuplicateTimer()
    setDuplicateTag(tag)
    duplicateTimer.current = setTimeout(() => setDuplicateTag(null), DUPLICATE_HINT_DURATION)
  }

  useEffect(() => {
    if (slot) {
      reset({ labels: slot.labels ?? [] })
      clearDuplicateTimer()
      setDuplicateTag(null)
    }
  }, [slot, reset])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values.labels)
    onOpenChange(false)
  })

  /**
   * 只清空當前編輯中的 chips，**不送出、不關閉 Dialog**——與其他編輯動作一致，
   * 一律等使用者按「儲存」才套用，也留有反悔（直接關掉 Dialog）的餘地。
   */
  const clearAll = () => {
    setValue('labels', [], { shouldDirty: true })
    clearDuplicateTimer()
    setDuplicateTag(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="slot-label-dialog" showCloseButton={false}>
        <DialogHeaderClose>
          <DialogTitle>{t('labelDialogTitle')}</DialogTitle>
        </DialogHeaderClose>
        <form onSubmit={submit} className="mt-2 flex flex-col gap-4">
          <Controller
            control={control}
            name="labels"
            render={({ field, fieldState }) => {
              const value = field.value ?? []
              // 直接由 field.value 推導，不用 watch()（React Compiler 無法安全 memo 化 watch）
              const remaining = Math.max(0, MAX_SLOT_LABELS - value.length)
              return (
                <Field data-invalid={fieldState.invalid}>
                  <Label htmlFor="slot-label-input">{t('labelFieldLabel')}</Label>
                  <TagInput
                    id="slot-label-input"
                    inputTestId="slot-label-input"
                    value={value}
                    onChange={field.onChange}
                    max={MAX_SLOT_LABELS}
                    maxLength={MAX_SLOT_LABEL_LENGTH}
                    placeholder={t('labelPlaceholder')}
                    removeLabel={(tag) => t('removeLabel', { label: tag })}
                    onDuplicate={handleDuplicate}
                    aria-invalid={fieldState.invalid}
                  />
                  {duplicateTag ? (
                    <p className="text-xs text-destructive" data-testid="slot-label-duplicate">
                      {t('labelDuplicate', { label: duplicateTag })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t('labelHint', { remaining, max: MAX_SLOT_LABEL_LENGTH })}
                    </p>
                  )}
                  <FieldError>
                    {fieldState.error && resolveFieldError(fieldState.error, tGlobal)}
                  </FieldError>
                </Field>
              )
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={clearAll}
              disabled={isSubmitting || currentLabels.length === 0}
              data-testid="slot-label-clear"
            >
              {t('clearAllLabels')}
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              disabled={isSubmitting}
              data-testid="slot-label-submit"
            >
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
