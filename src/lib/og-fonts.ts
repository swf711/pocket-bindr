import { readFileSync } from 'fs'
import { join } from 'path'
import type { OgFont } from '@/lib/og'

const FILES = {
  regular: 'NotoSansJP-Regular.otf',
  bold: 'NotoSansJP-Bold.otf',
} as const

let cache: OgFont[] | null = null

/** Buffer 可能是 pooled allocation 的一段 view，須裁切對應 ArrayBuffer 範圍，不可直接回傳 .buffer。 */
function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

/**
 * OG 字型（Noto Sans JP 400/700）自本地讀取，memoize。
 * 比照 og-logo.ts 的取捨：render path 零外部依賴、部署後輸出一致，
 * 換掉先前每次 render 打 Google Fonts CSS2 API 兩次（各含一次 CSS + 一次字型檔 fetch）的作法。
 * 讀檔失敗回空陣列，呼叫端據 fonts.length > 0 決定是否渲染文字——絕不讓 OG 路由崩。
 */
export function ogFonts(): OgFont[] {
  if (cache) return cache
  try {
    const regular = readFileSync(join(process.cwd(), 'public', 'fonts', FILES.regular))
    const bold = readFileSync(join(process.cwd(), 'public', 'fonts', FILES.bold))
    cache = [
      { name: 'Noto Sans JP', data: toArrayBuffer(regular), weight: 400, style: 'normal' },
      { name: 'Noto Sans JP', data: toArrayBuffer(bold), weight: 700, style: 'normal' },
    ]
    return cache
  } catch {
    return []
  }
}
