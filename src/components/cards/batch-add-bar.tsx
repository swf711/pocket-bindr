'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { BatchAddControls } from './batch-add-controls'

/**
 * 搜尋頁多選模式底部固定 bar。
 * - 桌面：strip 內直接 inline `BatchAddControls`。
 * - 手機：strip 只放「已選 N + 取消 + 加入」；點「加入」開底部 Drawer 放 `BatchAddControls`。
 * safe-area：`pb-[env(safe-area-inset-bottom)]` 讓 iPhone Home Indicator 機型不貼底被遮。
 */
export function BatchAddBar({
  selectedIds,
  onSuccess,
  onCancel,
}: {
  selectedIds: string[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const tBatch = useTranslations('cards.batch')
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSuccess = () => {
    setDrawerOpen(false)
    onSuccess()
  }

  return (
    <div
      data-testid="batch-add-bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <span data-testid="batch-selected-count" className="mr-auto text-sm font-medium whitespace-nowrap">
          {tBatch('selected', { count: selectedIds.length })}
        </span>

        {isMobile ? (
          <>
            <Button
              data-testid="batch-open-drawer"
              size="lg"
              onClick={() => setDrawerOpen(true)}
            >
              {tBatch('submit')}
            </Button>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="bottom">
              <DrawerContent data-testid="batch-add-drawer" className="pb-[max(1rem,env(safe-area-inset-bottom))]">
                <DrawerHeader>
                  <DrawerTitle>{tBatch('configureTitle')}</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-2">
                  <BatchAddControls selectedIds={selectedIds} onSuccess={handleSuccess} layout="stack" />
                </div>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <BatchAddControls selectedIds={selectedIds} onSuccess={handleSuccess} layout="row" />
        )}

        {/* 取消放在「加入卡冊」按鈕右側 */}
        <Button
          data-testid="batch-cancel-btn"
          variant="outline"
          size={isMobile ? 'lg' : 'default'}
          onClick={onCancel}
        >
          {tBatch('cancel')}
        </Button>
      </div>
    </div>
  )
}
