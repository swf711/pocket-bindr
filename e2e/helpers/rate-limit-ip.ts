/**
 * 為單一 spec 模組取得唯一的 `x-forwarded-for` identity。
 *
 * 為何需要：`src/lib/rate-limit.ts` 的多個 limiter 以 IP 為維度，而所有 Playwright worker
 * 都從同一個 localhost 位址發請求。若不注入唯一 IP，並行執行時各 spec（含 retry 重跑）會擠在
 * 同一個 sliding window 裡互相吃掉配額——`rl:forgot:ip` 的 5/15m 尤其緊。
 * 專案每個 rate-limited route 都直接讀此 header（無 trusted-proxy 驗證），故送什麼就算什麼。
 *
 * ⚠️ 唯一 IP 是必要的，光清 Redis 不夠：@upstash/ratelimit 的 in-process ephemeralCache 會把
 * 被 block 的 identifier 記在 server 記憶體裡直到窗口重置，清 Redis 也救不回來。
 *
 * 為何混入 `process.pid` 而非只用 `Date.now()`：Playwright 每個 worker 是獨立 process，pid 互異
 * 能保證跨 worker 唯一；只靠時間戳時，兩個 worker 同毫秒載入模組會拿到同一個 IP。
 */
export function uniqueTestIp(): string {
  return `10.${process.pid & 255}.${(Date.now() >> 8) & 255}.${Date.now() & 255}`
}

/** 供 `test.use({ extraHTTPHeaders: forwardedHeaders(TEST_IP) })` 使用（context-level，page 與 request fixture 皆涵蓋）。 */
export function forwardedHeaders(ip: string): Record<string, string> {
  return { 'x-forwarded-for': ip }
}
