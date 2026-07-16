export const PROXY_HOSTNAMES = [
  'asia-tc.onepiece-cardgame.com',
  'www.onepiece-cardgame.com',
  'en.onepiece-cardgame.com',
  'asia.pokemon-card.com',
  'www.pokemon-card.com',
]

/**
 * 卡圖傳輸體積優化：官網 hotlink 圖走 **混合 proxy** —— 部分 upstream host 走 Cloudflare Worker
 * 暖存 proxy（`workers/image-proxy/`，egress 免費），其餘留在 Vercel `/api/proxy-image`。哪些 host
 * 走 Worker 由 env 白名單控制，清單依各 origin 對 edge proxy 的相容性實測結果決定。與「不可自存官方
 * 卡圖」核心決策一致（見 CLAUDE.md）。
 *
 * ⚠️ 必須直接、靜態引用 `process.env.NEXT_PUBLIC_*`（不可包一層動態存取）——本函式同時被 client
 * component（如 `card-item.tsx`）與 server 端呼叫，Next.js 編譯器需要靜態可分析的字面引用才能把值
 * inline 進 client bundle。
 *
 * **兩個 env 皆可逆、粒度不同**：
 * - `NEXT_PUBLIC_IMAGE_PROXY_ORIGIN`（Worker base URL）未設 → 全部回退 `/api/proxy-image`（整體回滾）。
 * - `NEXT_PUBLIC_IMAGE_PROXY_WORKER_HOSTS`（逗號分隔的白名單，僅列此的 host 才走 Worker）——**刻意
 *   env-driven 非 hardcode**：origin 相容性會變，可從清單增減 + redeploy 調整而不用改 code。空/未設 →
 *   沒有 host 走 Worker（等同整體回滾）。
 */
const IMAGE_PROXY_ORIGIN = process.env.NEXT_PUBLIC_IMAGE_PROXY_ORIGIN
const WORKER_HOSTS = (process.env.NEXT_PUBLIC_IMAGE_PROXY_WORKER_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

export function getCardImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return url
  }
  if (PROXY_HOSTNAMES.includes(hostname)) {
    // 混合分流：Worker base 有設 + 該 host 在白名單內才走 Worker，否則一律 Vercel proxy。
    const useWorker = Boolean(IMAGE_PROXY_ORIGIN) && WORKER_HOSTS.includes(hostname)
    const base = useWorker ? IMAGE_PROXY_ORIGIN : '/api/proxy-image'
    return `${base}?url=${encodeURIComponent(url)}`
  }
  return url
}
