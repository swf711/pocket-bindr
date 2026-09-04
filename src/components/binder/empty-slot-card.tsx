'use client'

import { Plus, Minus } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useHasNoHover } from '@/hooks/use-has-hover'

export function EmptySlotCard({
  pageNumber,
  slotIndex,
  isDragging = false,
  onAddCard,
  onRemoveSlot,
  counterScale = 1,
}: {
  pageNumber: number
  slotIndex: number
  isDragging?: boolean
  onAddCard?: (pageNumber: number, slotIndex: number) => void
  /** 移除此空格、其後的卡往前遞補；未傳則不顯示移除鈕 */
  onRemoveSlot?: (pageNumber: number, slotIndex: number) => void
  /** 移除鈕需 counter-scale 才不會被 Snowglobe 縮到難以點擊（整格點擊本身不需要） */
  counterScale?: number
}) {
  const t = useTranslations('binder.emptySlot')
  const noHover = useHasNoHover()
  const { setNodeRef, isOver } = useDroppable({ id: `empty-${pageNumber}-${slotIndex}` })

  const showRemove = onRemoveSlot && !isDragging

  return (
    <div
      ref={setNodeRef}
      data-testid={`empty-slot-add-${pageNumber}-${slotIndex}`}
      data-page={pageNumber}
      data-index={slotIndex}
      onClick={(!isDragging && onAddCard) ? (e) => { e.stopPropagation(); onAddCard(pageNumber, slotIndex) } : undefined}
      className={`group relative w-full aspect-5/7 rounded-md border-2 border-dashed transition-colors ${
        isOver ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
      } ${(!isDragging && onAddCard) ? 'cursor-pointer' : ''}`}
    >
      {onAddCard && !isDragging && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-70 transition-opacity pointer-events-none">
          <Plus className="size-6 text-foreground" />
        </div>
      )}

      {/* 移除此空格 — 底部置中帶文字的 destructive 按鈕，位置與已填卡格位的操作列一致
          （桌面 hover 顯示／無 hover 裝置常駐）。counter-scale 讓 Snowglobe 縮放後仍是自然尺寸。
          🔴 整格點擊（加入卡片）是既有行為，故必須 stopPropagation。 */}
      {showRemove && (
        <div
          className={`absolute inset-0 flex items-end justify-center pb-2 transition-opacity ${
            noHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div style={{ transform: `scale(${counterScale})`, transformOrigin: 'bottom center' }}>
            <Button
              // 與 slot-card.tsx 的刪除鈕採**完全相同**的一組樣式：size="sm" 的高度（h-8）與圖示
              // 尺寸（size-4）等同該處的 icon-sm，hover 一律是 `bg-destructive/90`（變透明）。
              // 🔴 不可改用 variant="destructive"：那個 variant 在 dark 模式是
              // `dark:bg-destructive/60` + `dark:hover:bg-destructive/70`——hover 反而變得更不透明，
              // 與格位操作鈕的方向相反。差別只剩多了文字所需的左右內距。
              variant="default"
              size="sm"
              data-variant="destructive"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/50"
              data-testid={`empty-slot-remove-${pageNumber}-${slotIndex}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onRemoveSlot!(pageNumber, slotIndex)
              }}
            >
              <Minus />
              {t('removeSlot')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
