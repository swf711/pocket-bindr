'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SlotWithCard } from '@/types/binder'

/**
 * 格位底部的自訂標籤（如圖鑑編號、稀有度、待換標記），以 badge 並排呈現。
 * 常駐顯示——這個功能的價值就是「一眼掃過整頁」，藏進 hover 就沒意義了。
 *
 * 🔴 必須 counter-scale：卡冊桌面版是 Snowglobe CSS `scale()` 縮放，不補償的話小字
 * 在 iPad 直向（scale ≈0.68）會小到讀不出來。作法與 binder-public-view 的 `CoverLabel`
 * 相同——內層 `scale(counterScale)` 放大、寬度先除以 counterScale，讓縮放後的視覺寬度
 * 剛好還原成整格寬。transformOrigin 取 bottom left，使區塊由格位左下角往上、往右長出。
 */

/** badge 行高 1rem + 上下 padding，兩行的高度天花板；超出的 badge 直接裁掉不顯示。 */
const MAX_ROWS_HEIGHT = '2.25rem'

export function SlotLabelBadges({
  slot,
  counterScale = 1,
  className,
}: {
  slot: SlotWithCard
  counterScale?: number
  /**
   * 附加到根元素。呼叫端用來在操作按鈕出現時讓標籤淡出讓位——兩者都貼在格位底部會互相遮擋。
   * 本元件刻意不感知 hover／tap 狀態，公開分享頁（無操作按鈕）不傳即恆亮。
   */
  className?: string
}) {
  // 跨格群組只有 anchor 帶標籤，成員格不重複顯示（避免同一張卡出現 N 次相同文字）
  const isAnchor = !slot.span || slot.span.groupIndex === 0
  if (!slot.labels?.length || !isAnchor) return null

  return (
    <div
      // pb-2 與操作按鈕 overlay 的 pb-2 對齊（同一層未縮放座標），兩者離格位底部等距
      className={cn('pointer-events-none absolute inset-x-0 bottom-0 pb-2', className)}
      data-testid={`slot-label-${slot.id}`}
    >
      <div
        style={{
          transform: `scale(${counterScale})`,
          transformOrigin: 'bottom left',
          width: `${100 / counterScale}%`,
          maxHeight: MAX_ROWS_HEIGHT,
        }}
        className="flex flex-wrap items-end justify-center gap-0.5 overflow-hidden px-0.5"
      >
        {slot.labels.map((label, i) => (
          <Badge
            key={`${label}-${i}`}
            // tertiary 系：專案既有的刻意強調色，與編輯 Dialog 內的 chip 一致
            className="max-w-full truncate bg-tertiary-container text-on-tertiary-container"
            data-testid={`slot-label-item-${slot.id}-${i}`}
          >
            {label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
