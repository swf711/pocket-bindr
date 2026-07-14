import sharp from 'sharp'
import type { Locale } from '@/i18n/locale'
import { PROXY_HOSTNAMES } from '@/lib/get-card-image-url'

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

/**
 * OG response 快取（`ImageResponse` 的 `ResponseInit.headers`）。
 * 內容穩定的路由（單卡／首頁）用 LONG；隨時間變動或依賴外部 token 的（分享頁）用 SHORT；
 * fallback（brandFallback）一律 SHORT——避免暫時性失敗（卡不存在只是資料尚未同步、token 剛好打錯等）被凍結成長 TTL。
 */
export const OG_CACHE_LONG = 'public, max-age=0, s-maxage=604800, stale-while-revalidate=86400'
export const OG_CACHE_SHORT = 'public, max-age=0, s-maxage=300, stale-while-revalidate=60'

/** 相對路徑（如 PTCG/OPCG 代理圖 `/api/proxy-image?...`）補成絕對 URL；已是絕對 URL 則原樣返回。
 *  ⚠️ 供 card-jsonld.ts 產生對外可見的 schema.org 絕對 URL 使用，語意不可更動。 */
export function toAbsoluteUrl(url: string): string {
  return url.startsWith('http') ? url : `${SITE_URL}${url}`
}

/** OG render 時單張圖片 fetch 的逾時（ms）與失敗重試次數。
 *  逾時值依實測：`hnd1` 對 Supabase Storage / PTCG(pokemon-card.com) / OPCG(onepiece-cardgame.com)
 *  三類來源的 warm p95 均在 ~250ms 內（本地量測，冷 TLS 首擊曾見 ~1s）；4000ms 留約 15 倍餘裕
 *  涵蓋冷連線與跨太平洋抖動，同時仍是有界的（單張圖最壞情況 = timeout × (1+retries)）。 */
export const OG_IMAGE_FETCH_TIMEOUT_MS = 4000
export const OG_IMAGE_FETCH_RETRIES = 1

/**
 * OG render 專用：把卡圖 URL 正規化成「可直接 server 端 fetch 的 upstream URL + 必要 headers」。
 * 三種輸入形式：
 * - `/api/proxy-image?url=X`（首頁／單卡走 `getCardImageUrl` 產出的相對路徑）→ 還原成 X，
 *   不再讓 OG render 自呼自家 `/api/proxy-image` serverless（省一層跳、不佔用該路由的 IP rate limit）。
 * - 官網原始絕對 URL（分享頁的 `slot.card.imageSmall`，未經 `getCardImageUrl`，落在 `PROXY_HOSTNAMES`）
 *   → 官網會擋沒有 Referer 的請求（proxy-image route 本就補這個 header），OG 直連同樣要補，
 *   否則分享頁的官網來源卡圖在 OG 上幾乎必抓不到。
 * - 其餘絕對 URL（Supabase Storage 自存圖、pokemontcg.io）→ 原樣直連，不補 header。
 */
export function resolveOgImageFetch(url: string): { url: string; headers: HeadersInit } | null {
  if (url.startsWith('/api/proxy-image')) {
    const raw = new URL(url, SITE_URL).searchParams.get('url')
    if (!raw) return null
    return resolveOgImageFetch(raw)
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (PROXY_HOSTNAMES.includes(parsed.hostname)) {
    return { url, headers: { Referer: parsed.origin } }
  }

  return { url, headers: {} }
}

async function fetchWithTimeout(url: string, headers: HeadersInit): Promise<Response> {
  return fetch(url, { headers, signal: AbortSignal.timeout(OG_IMAGE_FETCH_TIMEOUT_MS) })
}

/** Satori/resvg（next/og 底層）可安全解碼的格式；WebP 等其餘格式會讓整個 ImageResponse render 崩潰
 *  （非優雅降級，是直接斷線）——實測發現：JA 舊世代／OPCG DON!! 卡的 backfill 自存圖存的是 .webp
 *  （見 CLAUDE.md「不 hotlink，改下載自存」），這類卡的單卡／分享頁 OG 過去必然整張失敗。 */
const SATORI_SAFE_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif'])

/** 非安全格式（如 webp）先經 sharp 轉 PNG 再內嵌，轉檔失敗視同抓取失敗回 null（不 500）。 */
async function toSatoriSafeDataUri(buf: Buffer, contentType: string): Promise<string | null> {
  if (SATORI_SAFE_IMAGE_TYPES.has(contentType)) {
    return `data:${contentType};base64,${buf.toString('base64')}`
  }
  try {
    const png = await sharp(buf).png().toBuffer()
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}

/**
 * 抓遠端圖片轉 data URI（供 OG image 預先內嵌，避免 Satori render 時單張 fetch 失敗整張 500）。
 * 每次嘗試皆有 timeout；失敗（含逾時／非 2xx／網路錯誤）重試最多 `OG_IMAGE_FETCH_RETRIES` 次。
 * 最終仍失敗回 null，呼叫端 filter 掉即可——既有「不 500」契約不變。
 */
export async function fetchImageDataUri(url: string): Promise<string | null> {
  const resolved = resolveOgImageFetch(url)
  if (!resolved) return null

  for (let attempt = 0; attempt <= OG_IMAGE_FETCH_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(resolved.url, resolved.headers)
      if (!res.ok) continue
      const type = res.headers.get('content-type') ?? 'image/jpeg'
      const buf = Buffer.from(await res.arrayBuffer())
      const dataUri = await toSatoriSafeDataUri(buf, type)
      if (dataUri) return dataUri
    } catch {
      continue
    }
  }
  return null
}

export type OgFont = {
  name: string
  data: ArrayBuffer
  weight: 400 | 700
  style: 'normal'
}
