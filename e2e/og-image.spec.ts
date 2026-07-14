// Requires running server and test database
import { test, expect, type Page } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import { clearUserBindersByEmail, clearBinderShareToken, createBinderWithSlots, getUserIdByEmail } from './helpers/db'
import { prisma } from '../src/lib/prisma'
import { PROXY_HOSTNAMES } from '../src/lib/get-card-image-url'
import { cardPath } from '../src/lib/card-url'

const USER = getTestUser('ogimage')

/**
 * 單卡頁的 opengraph-image 路由與 `@modal` 攔截路由共用 `cards/[game]/[language]/[externalId]/` 目錄，
 * Next 會為該 metadata route 產生帶 hash 後綴的實際檔名（如 `opengraph-image-17w0c6`），
 * 與根目錄 `/opengraph-image`、`/b/[token]/opengraph-image` 的行為不同（後兩者無此後綴）。
 * hash 對同一次 build 穩定、與 externalId 值無關，但硬編路徑會隨 build 漂移——
 * 一律從渲染後頁面的 `<meta property="og:image">` 動態取得真實路徑，不假設固定路徑。
 */
async function resolveCardOgImagePath(page: Page, path: string): Promise<string> {
  const res = await page.request.get(path)
  const html = await res.text()
  const match = html.match(/<meta property="og:image" content="([^"]+)"/)
  if (!match) throw new Error(`頁面 ${path} 找不到 og:image meta tag`)
  return new URL(match[1]).pathname
}

/** 找一張圖片來源落在 PROXY_HOSTNAMES（官網，非自存 Supabase）的卡，供驗證 D2 直連 + Referer 修法。 */
async function getOfficialSourceCard() {
  const card = await prisma.card.findFirst({
    where: {
      imageSmall: { not: '' },
      OR: PROXY_HOSTNAMES.map((host) => ({ imageSmall: { contains: host } })),
    },
    include: { set: true },
  })
  if (!card) throw new Error('找不到官網來源（PROXY_HOSTNAMES）圖片的卡，無法驗證 D2')
  return card
}

async function getSelfHostedCard() {
  const card = await prisma.card.findFirst({
    where: { imageSmall: { contains: 'supabase.co' } },
    include: { set: true },
  })
  if (!card) throw new Error('找不到自存 Supabase 圖片的卡')
  return card
}

test.describe('單卡 OG image', () => {
  test('回 200 image/png，且含卡圖（bytes 明顯大於 brandFallback 純 logo）', async ({ page }) => {
    const card = await getSelfHostedCard()
    const ogPath = await resolveCardOgImagePath(page, cardPath(card))
    const res = await page.request.get(ogPath)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('image/png')

    const body = await res.body()
    // brandFallback 只有純 logo，實測遠小於含卡圖版面；用寬鬆閾值避免測試與版面像素數綁死
    expect(body.byteLength).toBeGreaterThan(15_000)
  })

  test('官網來源卡（PROXY_HOSTNAMES）同樣有圖，不因缺 Referer 而退化成純文字/fallback', async ({ page }) => {
    const officialCard = await getOfficialSourceCard()
    const selfHostedCard = await getSelfHostedCard()

    const officialOgPath = await resolveCardOgImagePath(page, cardPath(officialCard))
    const selfHostedOgPath = await resolveCardOgImagePath(page, cardPath(selfHostedCard))
    const officialRes = await page.request.get(officialOgPath)
    const selfHostedRes = await page.request.get(selfHostedOgPath)

    expect(officialRes.status()).toBe(200)
    const officialBody = await officialRes.body()
    const selfHostedBody = await selfHostedRes.body()

    // 兩者應同量級（含卡圖），不應是「有圖 vs 純文字色塊」的數量級落差
    expect(officialBody.byteLength).toBeGreaterThan(15_000)
    expect(officialBody.byteLength).toBeGreaterThan(selfHostedBody.byteLength * 0.3)
  })

  test('Cache-Control 為 7 天長 TTL', async ({ page }) => {
    const card = await getSelfHostedCard()
    const ogPath = await resolveCardOgImagePath(page, cardPath(card))
    const res = await page.request.get(ogPath)
    expect(res.headers()['cache-control']).toContain('s-maxage=604800')
  })

  test('非法路徑回 200 brandFallback（不 500），且短 TTL', async ({ page }) => {
    // 非法（不存在的）externalId 的頁面本身即 404，og:image meta 不存在——
    // 改用真實卡的 hash 後綴路徑，帶入不存在的 externalId 驗證 brandFallback。
    const card = await getSelfHostedCard()
    const ogPath = await resolveCardOgImagePath(page, cardPath(card))
    const fakeOgPath = ogPath.replace(encodeURIComponent(card.externalId), 'this-card-does-not-exist-xyz')

    const res = await page.request.get(fakeOgPath)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('image/png')
    expect(res.headers()['cache-control']).toContain('s-maxage=300')
  })
})

test.describe('首頁 OG image', () => {
  test('回 200 image/png，長 TTL', async ({ page }) => {
    const res = await page.request.get('/opengraph-image')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('image/png')
    expect(res.headers()['cache-control']).toContain('s-maxage=604800')

    const body = await res.body()
    expect(body.byteLength).toBeGreaterThan(15_000)
  })
})

test.describe('分享頁 OG image', () => {
  test.beforeEach(async () => {
    await clearUserBindersByEmail(USER.email)
  })
  test.afterAll(async () => {
    await clearUserBindersByEmail(USER.email)
  })

  test('含官網來源卡的卡冊，分享頁 OG 卡圖 fan 不為空（D2 核心驗收）', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const officialCard = await getOfficialSourceCard()

    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [
      { cardId: officialCard.id, status: 'owned', pageNumber: 1, slotIndex: 0 },
    ])

    const shareRes = await page.request.post(`/api/binders/${binder.id}/share`)
    expect(shareRes.ok()).toBeTruthy()
    const { shareToken } = await shareRes.json()

    const ogRes = await page.request.get(`/b/${shareToken}/opengraph-image`)
    expect(ogRes.status()).toBe(200)
    const body = await ogRes.body()
    // 修好前：分享頁對官網來源卡缺 Referer，卡圖 fan 幾乎必空 → 版面退化成純色底 + logo + 文字面板
    expect(body.byteLength).toBeGreaterThan(15_000)

    await clearBinderShareToken(binder.id)
  })

  test('Cache-Control 為 5 分鐘短 TTL', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getSelfHostedCard()
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [
      { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 },
    ])
    const shareRes = await page.request.post(`/api/binders/${binder.id}/share`)
    const { shareToken } = await shareRes.json()

    const ogRes = await page.request.get(`/b/${shareToken}/opengraph-image`)
    expect(ogRes.headers()['cache-control']).toContain('s-maxage=300')

    await clearBinderShareToken(binder.id)
  })

  test('無效 token 回 200 brandFallback（不 500），短 TTL', async ({ page }) => {
    const res = await page.request.get('/b/this-token-does-not-exist-0000000000000000/opengraph-image')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('image/png')
    expect(res.headers()['cache-control']).toContain('s-maxage=300')
  })
})
