'use client'

import { useTranslations } from 'next-intl'
import { BetweenHorizontalStart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface InsertSlotGroupDialogProps {
  open: boolean
  /** 位移範圍內受影響的跨格群組數 */
  groupCount: number
  onOpenChange: (open: boolean) => void
  onChoose: (mode: 'shift' | 'collapse') => void
}

/**
 * 插入空格時位移範圍撞到跨格群組——刻意不靜默決定，讓使用者選整組往後推或先收合成單格。
 * 「收合」會刪掉 anchor 以外的成員（與既有「收合為單格」語意一致），故必須明確詢問。
 */
export function InsertSlotGroupDialog({
  open,
  groupCount,
  onOpenChange,
  onChoose,
}: InsertSlotGroupDialogProps) {
  const t = useTranslations('binder')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <BetweenHorizontalStart />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('insertSlotGroupTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('insertSlotGroupDescription', { count: groupCount })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* 三個選項改為單直列（由上而下：整組一起移動 → 先收合成單格 → 取消）。
            AlertDialogFooter 預設是 flex-col-reverse + sm:flex-row，size="sm" 還會切成
            grid-cols-2，故以 flex! 與 sm:flex-col 覆寫；不改動原生 shadcn 檔。 */}
        <AlertDialogFooter className="flex! flex-col sm:flex-col">
          <Button size="lg" data-testid="insert-slot-shift-btn" onClick={() => onChoose('shift')}>
            {t('insertSlotGroupShift')}
          </Button>
          <Button
            variant="tertiary"
            size="lg"
            data-testid="insert-slot-collapse-btn"
            onClick={() => onChoose('collapse')}
          >
            {t('insertSlotGroupCollapse')}
          </Button>
          <AlertDialogCancel variant="outline" size="lg" className="rounded-full!">
            {t('slotCard.cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
