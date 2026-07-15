'use client'
import { useCardTilt } from '@/hooks/use-card-tilt'
import { cn } from '@/lib/utils'
import { CardImage } from './card-image'

interface CardTiltImageProps {
  src: string
  alt: string
  className?: string
}

/**
 * 卡圖 hover 3D 傾斜互動的可重用封裝——與 CardDetailDrawer 卡圖同一套（`useCardTilt`，maxRotateDeg 15），
 * 供卡片獨立 SEO 頁（Server Component）以 client island 形式取得相同手感。
 * 刻意不動 drawer 既有 inline 版（已驗收），兩者共用同一 hook。三層結構：
 * 外層 container（`data-tilt-container` + handlers）→ transformer div（transformerStyle）→ img + shine div。
 */
export function CardTiltImage({ src, alt, className }: CardTiltImageProps) {
  const { containerRef, transformerStyle, shineStyle, handlers } = useCardTilt({ maxRotateDeg: 15 })

  return (
    <div
      ref={containerRef}
      data-tilt-container
      style={{ position: 'relative', borderRadius: 'var(--radius-lg)' }}
      className={className}
      {...handlers}
    >
      <div style={transformerStyle}>
        <CardImage
          data-testid="card-detail-image"
          src={src}
          alt={alt}
          className={cn('block w-full rounded-lg shadow-lg')}
        />
        <div style={shineStyle} />
      </div>
    </div>
  )
}
