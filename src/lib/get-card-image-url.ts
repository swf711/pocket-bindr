export const PROXY_HOSTNAMES = [
  'asia-tc.onepiece-cardgame.com',
  'www.onepiece-cardgame.com',
  'en.onepiece-cardgame.com',
  'asia.pokemon-card.com',
  'www.pokemon-card.com',
]

/**
 * 卡圖傳輸體積優化（feat/cloudflare-image-proxy）：官網 hotlink 圖改走 Cloudflare Worker
 * 暖存 proxy（`workers/image-proxy/`），egress 免費、且與現行 Vercel proxy 法律姿態零增量
 * （見 CLAUDE.md「不可自存官方卡圖」核心決策）。
 *
 * ⚠️ 必須直接、靜態引用 `process.env.NEXT_PUBLIC_IMAGE_PROXY_ORIGIN`（不可包一層動態存取）——
 * 本函式同時被 client component（如 `card-item.tsx`）與 server 端呼叫，Next.js 編譯器需要
 * 靜態可分析的 `process.env.NEXT_PUBLIC_*` 字面引用才能把值 inline 進 client bundle。
 *
 * 設定此 env 才切到 Worker；未設時回退 `/api/proxy-image`——**刻意可逆**，方便分階段驗證與回滾。
 */
const IMAGE_PROXY_ORIGIN = process.env.NEXT_PUBLIC_IMAGE_PROXY_ORIGIN

export function getCardImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return url
  }
  if (PROXY_HOSTNAMES.includes(hostname)) {
    const base = IMAGE_PROXY_ORIGIN || '/api/proxy-image'
    return `${base}?url=${encodeURIComponent(url)}`
  }
  return url
}
