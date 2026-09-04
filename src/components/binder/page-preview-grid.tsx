'use client'

import { GridType } from '@prisma/client'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import { getPagePreviewSize, PAGE_PREVIEW_HEIGHT, PAGE_PREVIEW_GAP } from '@/lib/binder-page-preview'
import { isMultiNumberCard } from '@/lib/card-number'
import { CardImage } from '../cards/card-image'
import { SpanCardImage } from './span-card-image'
import type { BinderSlotItem } from '@/types/binder'

interface PagePreviewGridProps {
  /** 該頁的完整格線（來自 `buildGridPages`），長度 = GRID_TYPE_SLOTS[gridType] */
  items: BinderSlotItem[]
  gridType: GridType
  /** 供 data-testid 使用的頁碼 */
  page: number
}

/**
 * 內頁管理清單每列的縮圖預覽：把該頁的格線縮成一張小圖，讓使用者拖曳重排時
 * 一眼認得出正在移動的是哪一頁（原本每列只有「第 N 頁」三個字）。
 *
 * 純裝飾（`aria-hidden`）——同一列已有「第 N 頁」文字與拖曳/刪除按鈕的 aria-label，
 * 讓螢幕閱讀器再唸一次一堆卡名只會是噪音。
 */
export function PagePreviewGrid({ items, gridType, page }: PagePreviewGridProps) {
  const { cols, cellWidth, cellHeight, width } = getPagePreviewSize(gridType)

  return (
    <div
      aria-hidden="true"
      data-testid={`page-preview-${page}`}
      className="grid shrink-0"
      style={{
        width,
        height: PAGE_PREVIEW_HEIGHT,
        gap: PAGE_PREVIEW_GAP,
        gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
        gridAutoRows: `${cellHeight}px`,
      }}
    >
      {items.map((item) =>
        item.id === null ? (
          <div
            key={`empty-${item.slotIndex}`}
            className="rounded-[1px] bg-muted/40"
          />
        ) : (
          <div key={item.id} className="relative overflow-hidden rounded-[1px] bg-card">
            {item.span ? (
              <SpanCardImage
                src={
                  item.span.imageUrl
                    ? getCardImageUrl(item.span.imageUrl)
                    : getCardImageUrl(item.card.imageSmall)
                }
                alt=""
                span={item.span}
                grayscale={item.status === 'wanted'}
              />
            ) : (
              <CardImage
                src={getCardImageUrl(item.card.imageSmall)}
                alt=""
                loading="lazy"
                draggable={false}
                // 複數卡佔 1 格時是整張合成圖，比例非標準卡；與其他消費點一致用 object-contain
                className={`h-full w-full ${
                  isMultiNumberCard(item.card.cardNumber) ? 'object-contain' : 'object-cover'
                }${item.status === 'wanted' ? ' grayscale' : ''}`}
              />
            )}
          </div>
        ),
      )}
    </div>
  )
}
