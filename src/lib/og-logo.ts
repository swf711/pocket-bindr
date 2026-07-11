import { readFileSync } from 'fs'
import { join } from 'path'

/** 各 logo 變體的寬高比（供 OG image 依高度換算等比寬度）。 */
export const LOGO_ASPECT = 885 / 175 // 完整 wordmark（logo-dark.svg）
export const LOGO_SM_ASPECT = 162 / 172 // 精簡 BI 標記（logo-dark-sm.svg）

const FILES = {
  full: 'logo-dark.svg', // 完整 wordmark，淺色字（深色/彩色底）
  fullLight: 'logo-light.svg', // 完整 wordmark，深色字（淺色底）
  sm: 'logo-dark-sm.svg', // 精簡 BI 標記，淺色字
} as const

export type LogoVariant = keyof typeof FILES

const cache: Partial<Record<LogoVariant, string>> = {}

/**
 * 品牌 logo（深色版，淺色字，供深色/彩色 OG 背景用）轉 data URI。
 * `full` = 完整 wordmark；`sm` = 精簡 BI 標記。僅供 node runtime 的 opengraph-image 路由使用；
 * memoize 避免每次 render 重讀檔。Satori（resvg）可直接 rasterize 此 SVG 文字，不需 PNG。
 */
export function logoDataUri(variant: LogoVariant = 'full'): string {
  if (!cache[variant]) {
    const svg = readFileSync(join(process.cwd(), 'public', FILES[variant]))
    cache[variant] = `data:image/svg+xml;base64,${svg.toString('base64')}`
  }
  return cache[variant]!
}
