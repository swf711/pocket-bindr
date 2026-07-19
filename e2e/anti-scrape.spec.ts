// Requires running server and test database
import { test, expect } from './helpers/test'
import { uniqueTestIp, forwardedHeaders } from './helpers/rate-limit-ip'

// /api/cards（cardsSearchIpLimiter）與 /api/proxy-image（proxyImageIpLimiter）皆為 IP 維度限流，
// 注入唯一 x-forwarded-for 避免與其他並行 spec / worker 擠同一 sliding window（見 helpers/rate-limit-ip.ts）。
test.use({ extraHTTPHeaders: forwardedHeaders(uniqueTestIp()) })

test.describe('資料防爬保護', () => {
  // 帶 rate limit 的 spec 一律關閉 retries：重試等同多打一次請求，會把測試本身要驗證的 429
  // 條件弄亂（見 report.spec.ts 既有慣例）。
  test.describe.configure({ retries: 0 })

  test('/api/cards 讀取端連續請求超過 IP 限流閾值回 429', async ({ page }) => {
    // ⚠️ 刻意不透過 playwright.config.ts 的 webServer.env 調低 RL_CARDS_SEARCH_LIMIT——
    // webServer 為全套 E2E 共用單一 server，調低閾值會波及所有 /cards 相關 spec（它們的瀏覽器
    // 請求無 x-forwarded-for header，一律 fallback 同一個 '127.0.0.1' 身分），造成大量無關 spec
    // 誤 429（已於實測中證實：全套跑出約 50 個失敗）。改用**正式預設閾值**（envInt fallback 300/min，
    // 見 rate-limit.ts 註解——原訂 60/min 經 E2E 4 workers 平行真實搜尋流量實測證實對合理平行使用場景
    // 過緊，已對齊既有 proxyImageIpLimiter 的 300/min 慣例調高），靠本檔頂部的唯一 x-forwarded-for
    // 與其他 spec 的 127.0.0.1 隔離，只是多打幾次請求。
    // 限流檢查在 handleGet 最前面，早於 game/language 驗證，故不需帶合法查詢參數。
    //
    // ⚠️ 改為分批併發（非序列 for 迴圈）：這是 300/min 的 sliding window，若序列逐一 await 301 次
    // 請求，在完整套件 4 worker 並行、CPU 被搶用時牆鐘時間可能超過 60 秒，導致視窗在打完前就往前
    // 滑動、429 永遠等不到而逾時（已於本機重現：單獨跑 spec 綠，套件內跑紅）。分批併發只加快「請求
    // 送達 server 的速度」，limiter 本身仍是逐次計數，語意不受影響。
    //
    // ⚠️ 上限留 3 倍餘裕（非剛好 limit+1）：@upstash/ratelimit 的 slidingWindow 是「當前+前一
    // window 依經過時間加權」的近似算法，若一批併發請求剛好跨到下一個 window 邊界（極少數情況），
    // 有效閾值會短暫鬆動，剛好 301 次不保證觸發 429（已於套件內實測重現過一次：301 次全部通過，
    // 最後一次因缺 game 參數回 400 而非 429）。序列版因牆鐘夠長，統計上遠離邊界，天然不受影響；
    // 併發版改以拉高總嘗試次數吸收此邊界誤差，仍遠低於 60 秒逾時預算。
    const DEFAULT_LIMIT = 300
    const MAX_ATTEMPTS = DEFAULT_LIMIT * 3
    const BATCH_SIZE = 50
    let lastStatus = 0
    for (let sent = 0; sent < MAX_ATTEMPTS && lastStatus !== 429; sent += BATCH_SIZE) {
      const batchCount = Math.min(BATCH_SIZE, MAX_ATTEMPTS - sent)
      const results = await Promise.all(
        Array.from({ length: batchCount }, () => page.request.get('/api/cards')),
      )
      for (const res of results) {
        const status = res.status()
        if (status === 429) {
          lastStatus = status
          break
        }
        lastStatus = status
      }
    }
    expect(lastStatus).toBe(429)

    const res = await page.request.get('/api/cards')
    expect(res.status()).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('RATE_LIMITED')
  })

  test('proxy-image 外站 Referer 視為 hotlink，回 403', async ({ page }) => {
    const res = await page.request.get('/api/proxy-image?url=https%3A%2F%2Fwww.onepiece-cardgame.com%2Ffake.png', {
      headers: { referer: 'https://evil.example.com/steal-cards' },
    })
    expect(res.status()).toBe(403)
  })

  test('proxy-image 缺 Referer/Origin 一律放行（保 Googlebot 抓 schema image）', async ({ page }) => {
    // page.request 為 Node 端 HTTP client，不經瀏覽器頁面、預設不帶 Referer/Origin。
    // 不帶 url 參數走到「Missing url parameter」400 分支即可證明 Referer 檢查沒有擋下——
    // 若被 Referer 檢查擋下會是 403，與此處斷言矛盾；刻意不觸發真實 upstream fetch 以避免
    // 測試依賴外部網路。
    const res = await page.request.get('/api/proxy-image')
    expect(res.status()).not.toBe(403)
    expect(res.status()).toBe(400)
  })

  test('proxy-image same-origin Referer 放行', async ({ page }) => {
    const res = await page.request.get('/api/proxy-image', {
      headers: { referer: 'http://localhost:3000/cards' },
    })
    expect(res.status()).not.toBe(403)
    expect(res.status()).toBe(400)
  })
})
