'use client'

import type { ReactNode } from 'react'
import { sourceCellForIndex, spanLayoutFromStored } from '@/lib/multi-card-layout'
import { CardImage } from '../cards/card-image'
import type { SlotSpan } from '@/types/binder'

interface SpanCardImageProps {
  /** 已經 getCardImageUrl 解析後的來源圖 URL */
  src: string | null | undefined
  alt: string
  span: SlotSpan
  /** wanted 狀態的黑白呈現 */
  grayscale?: boolean
  fallback?: ReactNode
}

/**
 * 跨格群組的單一格位：顯示來源合成圖的**對應區塊**。
 *
 * 複數卡的官方 detail 頁只有一張由 N 張實體卡拼成的合成圖，而實體卡冊裡它們是 N 張卡
 * 插在 N 個口袋——故每格各顯示合成圖的一塊，還原實體樣貌（也與 EN 來源本就拆列的呈現一致）。
 * 每塊的比例正好等於標準卡的 5:7，填滿格位後零裁切、零留白。
 *
 * DOM 兩／三層，刻意不改 `CardImage`（沿用它的 retry / fallback）：
 * 　裁切框（overflow-hidden）→〔需要時〕旋轉層 → 放大 N 倍並位移的圖。
 *
 * ⚠️ 旋轉層用 container query 單位（`100cqh` / `100cqw`）互換長寬，才能在不假設格位比例的
 * 前提下正確轉正 LEGEND 的橫式卡；裁切框因此需要 `container-type: size`。
 * 圖片刻意不套 `object-fit`（用預設的 fill）：等比縮放會為了保留比例而裁掉邊緣，
 * 讓相鄰格位的接縫對不齊，而合成圖與格線的比例誤差本來就在 0.5% 以內、肉眼不可見。
 */
export function SpanCardImage({ src, alt, span, grayscale = false, fallback }: SpanCardImageProps) {
  const layout = spanLayoutFromStored(span.cols, span.rows, span.rotation)
  const { row, col } = sourceCellForIndex(layout, span.groupIndex)
  const rotated = layout.rotation % 180 !== 0

  const image = (
    <CardImage
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      className={`absolute${grayscale ? ' grayscale' : ''}`}
      style={{
        width: `${layout.sourceCols * 100}%`,
        height: `${layout.sourceRows * 100}%`,
        left: `-${col * 100}%`,
        top: `-${row * 100}%`,
        // 🔴 必須用 inline style，不可靠 `max-w-none` utility：Tailwind preflight 的
        // `img, video { max-width: 100% }` 會把 `width: 200%` 夾成 100%，讓 col=1 的格位
        // 整張圖被移出視窗而全白。utility class 是否贏得過該規則取決於 layer 順序
        // （本專案已在 vaul／M3 shape token 兩度踩到 unlayered CSS 勝過 @layer utilities），
        // inline 宣告則不受任何 layer 影響。只有 sourceCols/sourceRows > 1 的形態會中招，
        // 故 LEGEND（原圖 1 欄）看起來正常、V-UNION 與 M6（2 欄）才壞——極易誤判成別的問題。
        maxWidth: 'none',
        maxHeight: 'none',
      }}
      fallback={fallback}
    />
  )

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ containerType: 'size' }}>
      {rotated ? (
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            width: '100cqh',
            height: '100cqw',
            transform: `translate(-50%, -50%) rotate(${layout.rotation}deg)`,
          }}
        >
          {image}
        </div>
      ) : (
        image
      )}
    </div>
  )
}
