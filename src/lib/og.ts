import type { Locale } from '@/i18n/locale'

/** 站點基底 URL（server-only）。metadataBase 與 OG 絕對圖片 URL 共用。
 *  production 由 AUTH_URL 提供；未設時 fallback localhost 避免 build 期 new URL throw。 */
export const SITE_URL = process.env.AUTH_URL ?? 'http://localhost:3000'

/** OG image 標準尺寸與型別（opengraph-image 檔案慣例 export 用）。 */
export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = 'image/png'

/** OG image 統一 dark 背景（首頁 hero 圖與分享頁 fallback 共用）。 */
export const OG_DARK_BG = 'linear-gradient(135deg, #12151b 0%, #0b0d12 100%)'

/** next-intl UI locale → Open Graph locale 代碼。 */
export const OG_LOCALE: Record<Locale, string> = {
  'zh-TW': 'zh_TW',
  en: 'en_US',
  ja: 'ja_JP',
}

/** 相對路徑（如 PTCG/OPCG 代理圖 `/api/proxy-image?...`）補成絕對 URL；已是絕對 URL 則原樣返回。 */
export function toAbsoluteUrl(url: string): string {
  return url.startsWith('http') ? url : `${SITE_URL}${url}`
}

/**
 * 抓遠端圖片轉 data URI（供 OG image 預先內嵌，避免 Satori render 時單張 fetch 失敗整張 500）。
 * 失敗回 null，呼叫端 filter 掉即可。
 */
export async function fetchImageDataUri(url: string): Promise<string | null> {
  try {
    const absolute = toAbsoluteUrl(url)
    const res = await fetch(absolute)
    if (!res.ok) return null
    const type = res.headers.get('content-type') ?? 'image/jpeg'
    const buf = Buffer.from(await res.arrayBuffer())
    return `data:${type};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

export type OgFont = {
  name: string
  data: ArrayBuffer
  weight: 400 | 700
  style: 'normal'
}

/**
 * Satori（ImageResponse）JIT 載入 Google Font——只抓 `text` 用到的字符（含 CJK）。
 * Node fetch 預設 UA 會讓 Google 回傳 ttf/otf（Satori 可解析；modern UA 會回 woff2 無法用）。
 * 任一步失敗回 null，由呼叫端決定 fallback（不可讓 OG 路由 500）。
 *
 * @param family css2 family 字串，含權重，如 `Noto+Sans+JP:wght@700`
 * @param text   欲渲染的文字（決定 subset 範圍）
 */
export async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`
    const cssRes = await fetch(url)
    if (!cssRes.ok) return null
    const css = await cssRes.text()
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/)
    if (!match) return null
    const fontRes = await fetch(match[1])
    if (!fontRes.ok) return null
    return await fontRes.arrayBuffer()
  } catch {
    return null
  }
}

/**
 * 載入 OG 圖所需字型集（含 CJK）。以 Noto Sans JP 為 CJK 主體——涵蓋日文與多數
 * Han 統一漢字（繁中字亦可顯示，字形採 JP 樣式，OG 預覽可接受）。
 * 回傳空陣列代表全部載入失敗，呼叫端應改渲染「無文字」的色塊 fallback。
 */
export async function loadOgFonts(text: string): Promise<OgFont[]> {
  const [bold, regular] = await Promise.all([
    loadGoogleFont('Noto+Sans+JP:wght@700', text),
    loadGoogleFont('Noto+Sans+JP:wght@400', text),
  ])
  const fonts: OgFont[] = []
  if (bold) fonts.push({ name: 'Noto Sans JP', data: bold, weight: 700, style: 'normal' })
  if (regular) fonts.push({ name: 'Noto Sans JP', data: regular, weight: 400, style: 'normal' })
  return fonts
}
