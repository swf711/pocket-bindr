import { test, expect } from '@playwright/test'
import { getTestUser } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearBinderShareToken,
  createBinderWithSlots,
  getCardWithImage,
  getOpcgZhTwAliasCard,
  getUserIdByEmail,
} from './helpers/db'
import { prisma } from '../src/lib/prisma'

const USER = getTestUser('sitemapnoindex')

test.describe('sitemap.xml + robots.txt', () => {
  test('robots.txt 回傳 200，含 Disallow 保護路由與 Sitemap 宣告', async ({ page }) => {
    const res = await page.request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()

    expect(body).toContain('Disallow: /binders')
    expect(body).toContain('Disallow: /settings')
    expect(body).toContain('Disallow: /collection')
    expect(body).toContain('Disallow: /api/')
    expect(body).toMatch(/Sitemap: .*\/sitemap\.xml/)
  })

  test('sitemap.xml 為合法 sitemapindex，不含受保護或分享頁路徑', async ({ page }) => {
    const res = await page.request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('xml')

    const body = await res.text()
    expect(body).toContain('<sitemapindex')
    expect(body).toContain('/sitemaps/static.xml')
    expect(body).toMatch(/\/sitemaps\/cards-0\.xml/)

    expect(body).not.toContain('/binders')
    expect(body).not.toContain('/settings')
    expect(body).not.toContain('/collection')
    expect(body).not.toContain('/b/')
  })

  test('static 子 sitemap 含公開靜態頁，卡片子 sitemap 含 <url> 且逐字元對應真實 canonical', async ({ page }) => {
    const staticRes = await page.request.get('/sitemaps/static.xml')
    expect(staticRes.status()).toBe(200)
    const staticBody = await staticRes.text()
    expect(staticBody).toContain('<urlset')
    expect(staticBody).toContain('<loc>')
    expect(staticBody).toContain('/cards</loc>')
    expect(staticBody).toContain('/terms</loc>')
    expect(staticBody).toContain('/privacy</loc>')

    const cardsRes = await page.request.get('/sitemaps/cards-0.xml')
    expect(cardsRes.status()).toBe(200)
    const cardsBody = await cardsRes.text()
    expect(cardsBody).toContain('<urlset')

    const locMatches = [...cardsBody.matchAll(/<loc>([^<]+)<\/loc>/g)]
    expect(locMatches.length).toBeGreaterThan(0)
    expect(locMatches.length).toBeLessThanOrEqual(20_000)

    const firstLoc = locMatches[0][1]
    const url = new URL(firstLoc)
    const cardResponse = await page.goto(url.pathname)
    expect(cardResponse?.status()).toBe(200)
    const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(new URL(canonicalHref!, url).pathname).toBe(url.pathname)
  })

  test('非法子 sitemap 檔名回 404', async ({ page }) => {
    const res = await page.request.get('/sitemaps/not-a-real-file.xml')
    expect(res.status()).toBe(404)
  })

  test('OPCG ZH_TW alias 卡（isCollectible=false）URL 出現在某個卡片子 sitemap', async ({ page }) => {
    const alias = await getOpcgZhTwAliasCard()
    test.skip(!alias, '測試環境無 OPCG ZH_TW alias 卡資料')

    const indexRes = await page.request.get('/sitemap.xml')
    const indexBody = await indexRes.text()
    const childPaths = [...indexBody.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(m => new URL(m[1]).pathname)
      .filter(p => p.startsWith('/sitemaps/cards-'))

    let found = false
    for (const childPath of childPaths) {
      const res = await page.request.get(childPath)
      const body = await res.text()
      if (body.includes(`/cards/opcg/zh-tw/${alias!.externalId}`)) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })

  test('sitemap 內卡片 URL 與 B0 頁面實際可訪路徑一致（抽驗 PTCG EN）', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    const indexRes = await page.request.get('/sitemap.xml')
    const indexBody = await indexRes.text()
    const childPaths = [...indexBody.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(m => new URL(m[1]).pathname)
      .filter(p => p.startsWith('/sitemaps/cards-'))

    let found = false
    for (const childPath of childPaths) {
      const res = await page.request.get(childPath)
      const body = await res.text()
      if (body.includes(`/cards/ptcg/en/${card.externalId}`)) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })
})

test.describe('公開分享頁 noindex', () => {
  test.beforeEach(async () => {
    await clearUserBindersByEmail(USER.email)
  })

  test('/b/[token] 的 meta robots 含 noindex，仍 follow 內部連結', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )
    const token = 'e2esitemapnoindextoken00000000001'
    await prisma.binder.update({ where: { id: binder.id }, data: { shareToken: token } })

    await page.goto(`/b/${token}`)

    const robotsContent = await page.locator('meta[name="robots"]').getAttribute('content')
    expect(robotsContent).toContain('noindex')
    expect(robotsContent).toContain('follow')

    await clearBinderShareToken(binder.id)
  })
})
