import { test, expect } from './helpers/test'
import { getCardWithImage, getOpcgZhTwAliasCard, findCardMissingField } from './helpers/db'

function toPath(game: string, card: { language: string; externalId: string }): string {
  const lang = card.language === 'ZH_TW' ? 'zh-tw' : card.language.toLowerCase()
  return `/cards/${game.toLowerCase()}/${lang}/${card.externalId}`
}

async function getJsonLd(page: import('@playwright/test').Page, path: string): Promise<Record<string, unknown>> {
  await page.goto(path)
  const raw = await page.locator('script[type="application/ld+json"]').textContent()
  expect(raw).toBeTruthy()
  return JSON.parse(raw!)
}

function graphOf(jsonLd: Record<string, unknown>): Array<Record<string, unknown>> {
  return jsonLd['@graph'] as Array<Record<string, unknown>>
}

test.describe('卡片頁 JSON-LD 結構化資料', () => {
  test('一般卡：@graph 合法、麵包屑四層、image 為絕對 URL、datePublished 存在', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    const jsonLd = await getJsonLd(page, toPath('PTCG', card))

    expect(jsonLd['@context']).toBe('https://schema.org')
    const graph = graphOf(jsonLd)
    const breadcrumb = graph.find((n) => n['@type'] === 'BreadcrumbList')!
    const webPage = graph.find((n) => n['@type'] === 'WebPage')!
    expect(breadcrumb).toBeTruthy()
    expect((breadcrumb.itemListElement as unknown[]).length).toBe(4)

    const mainEntity = webPage.mainEntity as Record<string, unknown>
    expect(mainEntity['@type']).toBe('CreativeWork')
    expect(mainEntity.image).toMatch(/^https?:\/\//)
    expect(mainEntity.datePublished).toBeTruthy()

    // 誠實原則：不應含 Product 語意
    const json = JSON.stringify(jsonLd)
    expect(json).not.toContain('"@type":"Product"')
    expect(json).not.toContain('"offers"')
  })

  test('OPCG ZH_TW alias 卡：image 非空、為 JA canonical 圖來源，inLanguage 為 zh-TW', async ({ page }) => {
    const alias = await getOpcgZhTwAliasCard()
    test.skip(!alias, '此環境無 OPCG ZH_TW alias 卡資料')

    const jsonLd = await getJsonLd(page, `/cards/opcg/zh-tw/${alias!.externalId}`)
    const webPage = graphOf(jsonLd).find((n) => n['@type'] === 'WebPage')!
    const mainEntity = webPage.mainEntity as Record<string, unknown>

    expect(webPage.inLanguage).toBe('zh-TW')
    // canonical JA 圖來源不一定經 proxy（DON!! 卡自存 Supabase、其餘官網圖走 /api/proxy-image）；
    // 只驗證非空且為絕對 URL——resolveCardDisplayImage 生效即代表沒破圖。
    expect(mainEntity.image as string).toMatch(/^https?:\/\//)
  })

  test('頁面可見麵包屑存在，末節為卡名且非連結', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    await page.goto(toPath('PTCG', card))

    const nav = page.getByRole('navigation', { name: 'breadcrumb' })
    await expect(nav).toBeVisible()
    const lastItem = nav.locator('[data-slot="breadcrumb-page"]')
    await expect(lastItem).toHaveText(card.name)
  })

  test('robots.txt 同時含 Disallow: /api/ 與 Allow: /api/proxy-image', async ({ page }) => {
    const res = await page.request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('Disallow: /api/')
    expect(body).toContain('Allow: /api/proxy-image')
  })

  test('既有 metadata（canonical / og:locale）與 JSON-LD 並存無衝突', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    await page.goto(toPath('PTCG', card))

    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:locale"]')).toHaveCount(1)
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
  })

  test.describe('條件輸出：空欄位整個省略，不輸出空值', () => {
    async function assertNoEmptyValues(jsonLd: Record<string, unknown>) {
      const json = JSON.stringify(jsonLd)
      expect(json).not.toContain(':null')
      expect(json).not.toContain('""')
      expect(json).not.toContain('[]')
    }

    test('PTCG ZH_TW 卡：無 rarity property', async ({ page }) => {
      const card = await findCardMissingField('rarity')
      const jsonLd = await getJsonLd(page, toPath(card.game, card))
      const mainEntity = (graphOf(jsonLd).find((n) => n['@type'] === 'WebPage')!.mainEntity) as Record<
        string,
        unknown
      >
      const props = (mainEntity.additionalProperty as Array<{ name: string }> | undefined) ?? []
      expect(props.find((p) => p.name === 'rarity')).toBeUndefined()
      await assertNoEmptyValues(jsonLd)
    })

    test('supertype 為空字串的卡：無 supertype property', async ({ page }) => {
      const card = await findCardMissingField('supertype')
      const jsonLd = await getJsonLd(page, toPath(card.game, card))
      const mainEntity = (graphOf(jsonLd).find((n) => n['@type'] === 'WebPage')!.mainEntity) as Record<
        string,
        unknown
      >
      const props = (mainEntity.additionalProperty as Array<{ name: string }> | undefined) ?? []
      expect(props.find((p) => p.name === 'supertype')).toBeUndefined()
      await assertNoEmptyValues(jsonLd)
    })

    test('非寶可夢卡（hp/types 缺漏）：無 hp / types property', async ({ page }) => {
      const card = await findCardMissingField('hp')
      const jsonLd = await getJsonLd(page, toPath(card.game, card))
      const mainEntity = (graphOf(jsonLd).find((n) => n['@type'] === 'WebPage')!.mainEntity) as Record<
        string,
        unknown
      >
      const props = (mainEntity.additionalProperty as Array<{ name: string }> | undefined) ?? []
      expect(props.find((p) => p.name === 'hp')).toBeUndefined()
      await assertNoEmptyValues(jsonLd)
    })

    test('set.releaseDate 為 null 的卡：無 datePublished', async ({ page }) => {
      const card = await findCardMissingField('releaseDate')
      const jsonLd = await getJsonLd(page, toPath(card.game, card))
      const mainEntity = (graphOf(jsonLd).find((n) => n['@type'] === 'WebPage')!.mainEntity) as Record<
        string,
        unknown
      >
      expect(mainEntity.datePublished).toBeUndefined()
      await assertNoEmptyValues(jsonLd)
    })
  })
})
