/**
 * pocketbindr-image-proxy — Cloudflare Worker
 *
 * 取代 Vercel `/api/proxy-image`：外部官網卡圖（PROXY_HOSTNAMES）的暖存 proxy。
 * ⚠️ 純 passthrough，不轉檔、不改體積、不落地永久儲存——僅 CF edge 暫時快取（cacheTtl）。
 * 這是刻意的合規邊界：pokemon-card.com / onepiece-cardgame.com 官網明文禁止「複製、改変、配布」
 * 卡圖（見 CLAUDE.md 核心設計決策、docs/DATA_SOURCES.md），故不可下載自存到 R2/Supabase；
 * 暖存 proxy（fetch-on-demand + 短期 edge cache）與現行 Vercel proxy 法律姿態零增量。
 *
 * 部署：本檔為 production runtime，`wrangler deploy`（非 dev/PoC）。詳見計畫 workers/image-proxy/README.md。
 */

// 與 src/lib/get-card-image-url.ts 的 PROXY_HOSTNAMES + src/app/api/proxy-image/route.ts 的
// API_WHITELIST 對齊。Worker 獨立部署、無法 import src/，故此處獨立維護一份（與 scripts/ 稽核工具同慣例）。
const WHITELIST = new Set([
  'asia-tc.onepiece-cardgame.com',
  'www.onepiece-cardgame.com',
  'en.onepiece-cardgame.com',
  'asia.pokemon-card.com',
  'www.pokemon-card.com',
  'images.pokemontcg.io',
])

const UPSTREAM_TIMEOUT_MS = 5000
const UPSTREAM_RETRIES = 1
// CF edge 暖存 TTL（秒）：暫時性快取，非永久圖庫——與現行 Vercel s-maxage=86400 同數量級,
// 拉長至 7 天以更有效攤提向官網的重複請求（暖存不等於自存，逾期即需重新 fetch upstream）。
const CACHE_TTL_SECONDS = 604800
const BROWSER_CACHE_CONTROL = 'public, max-age=604800'

/**
 * ⚠️ 修復（2026-07-16 上線後回報「部分卡圖不定期 502」）：原用 `cacheEverything: true` + 單一
 * `cacheTtl`，CF 官方文件證實 `cacheEverything` 不排除非 2xx 回應——官網偶發一次暫時性錯誤
 * （502/503）就會連同 7 天 TTL 一起被 CF edge cache 釘住，該張卡圖之後持續吃到快取的錯誤回應，
 * 直到 TTL 到期才自然恢復（症狀完全對應「特定幾張卡不定期持續失敗」，非隨機性的單次抖動）。
 * 改用 `cacheTtlByStatus`：只快取 2xx，其餘一律不快取（`-1` 依官方文件語意為完全不快取，
 * 比 `0`「立即過期」更乾淨、不留 cache entry），錯誤永遠即時重打 origin，不會被錯誤自己鎖住。
 */
const CACHE_TTL_BY_STATUS = { '200-299': CACHE_TTL_SECONDS, '300-599': -1 }

/**
 * 判斷是否為「應擋的外站 hotlink」。缺 Referer/Origin 一律放行（fail-open）——
 * Googlebot 抓圖常不帶 Referer，若一併擋掉會打臉 CLAUDE.md B1 的 SEO 目標；
 * 只在能正向確認來源 origin 不在 allowedOrigins 內時才視為外站 hotlink。
 * 移植自 src/lib/same-origin.ts 的 isCrossOriginHotlink，但改吃**允許清單**而非單一 siteOrigin——
 * Worker 是獨立部署單位，讀不到 app 端的 AUTH_URL（Vercel route 原本靠它動態決定 SITE_ORIGIN，
 * 本機測 http://localhost:3000、production 是 https://pocketbindr.app，兩者不同）。改由
 * wrangler.jsonc 的 vars.ALLOWED_ORIGINS 設定，涵蓋正式站 + 本機開發，避免寫死單一值。
 */
function isCrossOriginHotlink(referer, origin, allowedOrigins) {
  const source = origin ?? referer
  if (!source) return false
  try {
    return !allowedOrigins.includes(new URL(source).origin)
  } catch {
    return false
  }
}

/** 逾時/網路錯誤重試 UPSTREAM_RETRIES 次；非 2xx 不在此重試，交由呼叫端依 status 決定快取策略。 */
async function fetchUpstream(url, headers) {
  let lastErr
  for (let attempt = 0; attempt <= UPSTREAM_RETRIES; attempt++) {
    try {
      return await fetch(url, {
        headers,
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        // CF 原生 fetch cache 控制：edge 暖存，暫時性，非落地儲存。只快取成功回應（見上方說明）。
        cf: { cacheTtlByStatus: CACHE_TTL_BY_STATUS },
      })
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const reqUrl = new URL(request.url)
    // env.ALLOWED_ORIGINS（wrangler.jsonc vars，逗號分隔）未設時 fallback 僅正式站，
    // 避免設定漏帶時整條防線意外全開。
    const allowedOrigins = (env.ALLOWED_ORIGINS ?? 'https://pocketbindr.app')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)

    // Referer/Origin 檢查排在限流之前（省一次 rate limiter 呼叫），比照現行 Vercel route 順序。
    if (
      isCrossOriginHotlink(
        request.headers.get('referer'),
        request.headers.get('origin'),
        allowedOrigins,
      )
    ) {
      return new Response('Forbidden', {
        status: 403,
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    // rate limit：CF 原生 binding 取代 Upstash proxyImageIpLimiter（300/min per IP，見 wrangler.jsonc）。
    if (env.IMAGE_PROXY_RATE_LIMITER) {
      const ip = request.headers.get('cf-connecting-ip') ?? '127.0.0.1'
      const { success } = await env.IMAGE_PROXY_RATE_LIMITER.limit({ key: ip })
      if (!success) {
        return new Response('Too Many Requests', {
          status: 429,
          headers: { 'Cache-Control': 'no-store' },
        })
      }
    }

    const rawUrl = reqUrl.searchParams.get('url')
    if (!rawUrl) {
      return new Response('Missing url parameter', { status: 400 })
    }

    let parsed
    try {
      parsed = new URL(rawUrl)
    } catch {
      return new Response('Invalid URL', { status: 400 })
    }

    if (!WHITELIST.has(parsed.hostname)) {
      return new Response('Forbidden', { status: 403 })
    }

    let upstream
    try {
      upstream = await fetchUpstream(rawUrl, { Referer: parsed.origin })
    } catch {
      return new Response('Bad Gateway', {
        status: 502,
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg'

    // 非 2xx 一律 no-store，避免錯誤回應被瀏覽器/CDN 快取釘死（比照現行 Vercel route N1 決策）。
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': upstream.ok ? BROWSER_CACHE_CONTROL : 'no-store',
        // 官網卡圖多設 CORP: same-site；改指向本 Worker 網域後需自設 cross-origin
        // 才能繼续跨源（pocketbindr.app）嵌入 <img>。見 docs/PATTERNS.md「圖片 URL 統一走 getCardImageUrl」。
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    })
  },
}
