'use client'

import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'

/** onError 後最多重試次數（上限 1，單調遞增、不可能無限迴圈）。 */
const MAX_RETRY = 1
/** 重試延遲基底（ms）+ jitter 上限：整頁破圖時錯開重打，避免對 proxy 打出同步尖峰、加速撞 IP rate limit。 */
const RETRY_DELAY_MS = 500
const RETRY_JITTER_MS = 300

interface CardImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  /** 已經 `getCardImageUrl` 解析後的圖片 URL；null/空字串一律走 fallback。 */
  src: string | null | undefined
  /**
   * 重試用盡（reason="error"）或 src 為空（reason="no-image"）時顯示的替代內容。
   * 若為單一 React element，會被注入 `data-fallback-reason` 供 E2E 精確定位；省略則失敗後不 render 任何東西
   *（大圖情境如 CardTiltImage / CardDetailDrawer，寧可留白也不要瀏覽器預設破圖 icon）。
   */
  fallback?: ReactNode
}

/**
 * 卡圖共用元件：暫時性 fetch 失敗（多為走 `/api/proxy-image` 的官網來源卡快速換頁時被排擠/冷啟）時，
 * 自動重試一次再落 fallback，取代瀏覽器預設破圖 icon。
 *
 * ⚠️ 重試靠 `key={attempt}` 強制 `<img>` remount 才會對**完全相同的 URL** 重發請求
 *（僅改 state 但 src 不變，React 不會改動 DOM attribute → 不會重打）。刻意**不加** cache-bust query：
 * 那會改變 CDN cache key 使 retry 保證 miss、污染快取、加速撞 proxy IP rate limit（見 docs/PATTERNS.md）。
 */
export function CardImage({ src, fallback, alt = '', ...imgProps }: CardImageProps) {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // src 變動（同一元件被複用於不同卡）時重置重試狀態；多數父層已用 key={card.id} 換元件，此為穩健兜底。
  useEffect(() => {
    setAttempt(0)
    setFailed(false)
  }, [src])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  if (!src || failed) {
    const reason = src ? 'error' : 'no-image'
    if (isValidElement(fallback)) {
      return cloneElement(
        fallback as ReactElement<{ 'data-fallback-reason'?: string }>,
        { 'data-fallback-reason': reason },
      )
    }
    return <>{fallback ?? null}</>
  }

  return (
    <img
      key={attempt}
      src={src}
      alt={alt}
      onError={() => {
        if (attempt < MAX_RETRY) {
          timerRef.current = setTimeout(
            () => setAttempt((a) => a + 1),
            RETRY_DELAY_MS + Math.random() * RETRY_JITTER_MS,
          )
        } else {
          setFailed(true)
        }
      }}
      {...imgProps}
    />
  )
}
