import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { redis } from './redis'

// 測試隔離用選填 namespace（如 CI 的 ci-{run_id}-{run_attempt}）：未設時 prefix 維持原樣，
// production 零影響。讓 CI 內每個 workflow run 有自己的 sliding-window key 空間，
// 不與本機開發或其他併發 run 互踩；key 有 TTL，舊 namespace 自然過期，不需清理。
export function rlPrefix(prefix: string): string {
  const ns = process.env.RL_PREFIX_NAMESPACE
  return ns ? `${ns}:${prefix}` : prefix
}

export const forgotPasswordIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: rlPrefix('rl:forgot:ip'),
})

export const forgotPasswordEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 m'),
  prefix: rlPrefix('rl:forgot:email'),
})

// Registration: 10 attempts/hr per IP, 5/hr per email
export const registerIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: rlPrefix('rl:register:ip'),
})

export const registerEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 m'),
  prefix: rlPrefix('rl:register:email'),
})

// Password change (PATCH): 10/15min per IP, 5/15min per userId
export const passwordChangeIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'),
  prefix: rlPrefix('rl:pw-change:ip'),
})

export const passwordChangeUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: rlPrefix('rl:pw-change:user'),
})

// Password set for OAuth users (POST): 10/hr per IP, 3/hr per userId
export const passwordSetIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: rlPrefix('rl:pw-set:ip'),
})

export const passwordSetUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 m'),
  prefix: rlPrefix('rl:pw-set:user'),
})

// Add email for pure-OAuth users — request (POST /api/user/email/request):
// 10/hr per IP, 3/hr per userId
export const emailRequestIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: rlPrefix('rl:email-request:ip'),
})

export const emailRequestUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 m'),
  prefix: rlPrefix('rl:email-request:user'),
})

// Add email for pure-OAuth users — verify (POST /api/user/email/verify): 10/hr per IP
export const emailVerifyIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: rlPrefix('rl:email-verify:ip'),
})

// Signup email verification (POST /api/auth/verify-signup, unauthenticated): 10/hr per IP
export const signupVerifyIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: rlPrefix('rl:signup-verify:ip'),
})

// Resend signup verification email (POST /api/auth/resend-verification): 10/hr per IP, 3/hr per email
export const resendVerificationIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: rlPrefix('rl:resend-verify:ip'),
})

export const resendVerificationEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 m'),
  prefix: rlPrefix('rl:resend-verify:email'),
})

// OAuth account linking (initiate): 10/hr per IP, 5/hr per userId
export const linkIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: rlPrefix('rl:link:ip'),
})

export const linkUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 m'),
  prefix: rlPrefix('rl:link:user'),
})

// Report (missing card / bug): 10/hr per IP, 5/hr per userId
export const reportIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 m'),
  prefix: rlPrefix('rl:report:ip'),
})

export const reportUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 m'),
  prefix: rlPrefix('rl:report:user'),
})

// Batch add cards to binder (POST /api/binders/[id]/cards/batch): 40/min per IP, 20/min per userId
export const batchAddIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, '1 m'),
  prefix: rlPrefix('rl:binder-batch:ip'),
})

export const batchAddUserLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: rlPrefix('rl:binder-batch:user'),
})

// Card image proxy: 300/min per IP. Generous enough for a full binder page load
// (only un-self-hosted official images are proxied; most images are direct Supabase),
// while capping abuse as a bandwidth relay for the whitelisted hosts.
export const proxyImageIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(300, '1 m'),
  prefix: rlPrefix('rl:proxy-img:ip'),
})

// 讀取端防爬限流（feat/anti-scrape-read-limits）：閾值刻意讀 env，不寫死於原始碼——
// 本 repo 開源，寫死數字等於公開告訴爬蟲「N 次以下安全」；既有 auth 限流器對爬蟲無價值故維持硬編碼不動。
export function envInt(name: string, fallback: number): number {
  const v = parseInt(process.env[name] ?? '', 10)
  return Number.isFinite(v) && v > 0 ? v : fallback
}

export function envWindow(name: string, fallback: Duration): Duration {
  const v = process.env[name]
  return v && /^\d+\s*(ms|s|m|h|d)$/.test(v) ? (v as Duration) : fallback
}

// 列表/搜尋（GET /api/cards）：單頁可達 100 筆，批量抓取最省事的火力口。
// 預設值比照既有 proxyImageIpLimiter（300/min）的理由——共用 IP（NAT／辦公網路／多分頁同時瀏覽）
// 的真人快速翻頁 + 篩選 + debounce 觸發的請求量遠高於單人單請求，閾值過緊會誤傷真人（E2E 4 workers
// 平行對同一 fallback IP '127.0.0.1' 的真實搜尋流量已實測撞到 60/min，證實該值對合理平行使用場景過緊）。
export const cardsSearchIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    envInt('RL_CARDS_SEARCH_LIMIT', 300),
    envWindow('RL_CARDS_SEARCH_WINDOW', '1 m'),
  ),
  prefix: rlPrefix('rl:cards-search:ip'),
})

// 單卡詳情（GET /api/cards/[id]）與系列列表（GET /api/sets）共用，較輕量，理由同上。
export const cardsReadIpLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    envInt('RL_CARDS_READ_LIMIT', 300),
    envWindow('RL_CARDS_READ_WINDOW', '1 m'),
  ),
  prefix: rlPrefix('rl:cards-read:ip'),
})

/** 共用 client IP 取值：取 XFF 首段（沿用 POST /api/report 既有慣例），無 trusted-proxy 驗證。 */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  return (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
}
