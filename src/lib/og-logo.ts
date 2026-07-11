import { readFileSync } from 'fs'
import { join } from 'path'

/** 各 logo 變體的寬高比（供 OG image 依高度換算等比寬度）。 */
export const LOGO_ASPECT = 885 / 175 // 完整 wordmark
export const LOGO_SM_ASPECT = 162 / 172 // 精簡 BI 標記

const FILES = {
  full: 'logo-dark.png', // 完整 wordmark，淺色字（深/彩底）
  sm: 'logo-dark-sm.png', // 精簡 BI 標記，淺色字
} as const

export type LogoVariant = keyof typeof FILES

const cache: Partial<Record<LogoVariant, string>> = {}

/**
 * 品牌 logo（淺色字版，供深/彩底 OG 背景用）轉 data URI。`full` = 完整 wordmark；`sm` = 精簡 BI 標記。
 * **刻意用點陣 PNG 而非 SVG**：@vercel/og 的 resvg 在 Vercel serverless 無系統字型，rasterize SVG `<text>`
 * 會字型錯亂（本機 dev 有 fallback 字型才正常）；PNG 由 resvg 直接貼、零字型依賴、部署後像素一致。
 * PNG 為手動維護（由 logo 截圖產生、committed 進 public/）；換字型/字距時需一併重出 PNG。
 * 僅供 node runtime 的 opengraph-image 路由使用；memoize 避免每次 render 重讀檔。
 */
export function logoDataUri(variant: LogoVariant = 'full'): string {
  if (!cache[variant]) {
    const png = readFileSync(join(process.cwd(), 'public', FILES[variant]))
    cache[variant] = `data:image/png;base64,${png.toString('base64')}`
  }
  return cache[variant]!
}
