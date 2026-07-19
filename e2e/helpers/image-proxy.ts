import { config } from 'dotenv'
// Load .env then .env.local (override), matching Next.js precedence — same convention as
// e2e/helpers/db.ts, so this helper sees the same NEXT_PUBLIC_IMAGE_PROXY_* values the app
// would have inlined at build time (whether Worker mode is on in this environment or not).
config({ path: '.env' })
config({ path: '.env.local', override: true })

/**
 * 鏡射 src/lib/get-card-image-url.ts 的混合分流邏輯，供 E2E 斷言使用。
 * 刻意不 import 該模組本身——它讀的是 build-time inline 的 NEXT_PUBLIC_* client 常數，
 * Node 端 E2E helper 用同一套 dotenv 慣例直接讀 process.env 更貼合現有慣例、也更可靠。
 * ⚠️ 白名單/base URL 一律讀 env，不可寫死，否則會與 src 端規則分岔。
 */
const IMAGE_PROXY_ORIGIN = process.env.NEXT_PUBLIC_IMAGE_PROXY_ORIGIN
const WORKER_HOSTS = (process.env.NEXT_PUBLIC_IMAGE_PROXY_WORKER_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

/** 該 hostname 預期會用哪個 proxy base（Worker origin 或 Vercel 相對路徑）。 */
export function expectedProxyBase(hostname: string): string {
  const useWorker = Boolean(IMAGE_PROXY_ORIGIN) && WORKER_HOSTS.includes(hostname)
  return useWorker ? IMAGE_PROXY_ORIGIN! : '/api/proxy-image'
}

/**
 * 給 page.route 用的攔截 glob。涵蓋兩種模式：
 * - Worker 模式：跨 origin 絕對 URL（如 https://images.pocketbindr.app/?url=...）
 * - Vercel 模式：相對路徑 /api/proxy-image
 * 傳入預期會命中的 hostname（如 'www.pokemon-card.com'）以判斷該用哪個 pattern。
 */
export function proxyRouteGlob(hostname: string): string {
  const base = expectedProxyBase(hostname)
  if (base === '/api/proxy-image') {
    return '**/api/proxy-image**'
  }
  // base 為 Worker origin（絕對 URL）。Playwright 的 URL glob 對「含 protocol 的絕對 URL +
  // 開頭 `**`」的匹配並不可靠（`**` 不吃 `://`），改用「host + 任意路徑」的相對 glob 形式，
  // Playwright 會對完整 request URL 做子字串式 glob 匹配，可跨 origin 命中。
  const host = new URL(base).host
  return `**://${host}/**`
}

/**
 * 斷言某個 img src 確實經過 proxy（Worker 或 Vercel 皆可），且轉發的 `url` 參數
 * hostname 符合預期（不硬編碼 base 字面值，只驗證語意不變式）。
 */
export function assertProxiedImageSrc(
  src: string,
  pageUrl: string,
  hostnamePattern: RegExp,
): void {
  const isVercelProxy = src.includes('/api/proxy-image')
  const isWorkerProxy = Boolean(IMAGE_PROXY_ORIGIN) && src.startsWith(IMAGE_PROXY_ORIGIN!)
  if (!isVercelProxy && !isWorkerProxy) {
    throw new Error(`Expected src to be proxied (Vercel or Worker), got: ${src}`)
  }
  const resolved = new URL(src, pageUrl)
  const proxiedUrl = resolved.searchParams.get('url')
  if (!proxiedUrl) {
    throw new Error(`Expected proxied src to have a 'url' query param, got: ${src}`)
  }
  const proxiedHostname = new URL(proxiedUrl).hostname
  if (!hostnamePattern.test(proxiedHostname)) {
    throw new Error(
      `Expected proxied url hostname to match ${hostnamePattern}, got: ${proxiedHostname}`,
    )
  }
}
