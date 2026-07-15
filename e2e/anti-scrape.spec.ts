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
    const DEFAULT_LIMIT = 300
    let lastStatus = 0
    for (let i = 0; i < DEFAULT_LIMIT + 1; i++) {
      const res = await page.request.get('/api/cards')
      lastStatus = res.status()
      if (lastStatus === 429) break
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
