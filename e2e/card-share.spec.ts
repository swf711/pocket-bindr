// Requires running server and test database
import { test, expect, type Page } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  createBinderWithSlots,
  getCardWithImage,
  getUserIdByEmail,
} from './helpers/db'

const USER = getTestUser('cardshare')

/**
 * ⚠️ navigator.share 在 Playwright Chromium（macOS）上「可能存在」——真的觸發會叫出 OS 分享單
 * 導致測試掛住。故兩條路徑都以 addInitScript 明確 stub，絕不依賴環境預設值。
 */
async function stubWebShare(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data: ShareData) => {
        ;(window as unknown as { __shared?: ShareData }).__shared = data
        return Promise.resolve()
      },
    })
  })
}

async function removeWebShare(page: Page) {
  await page.addInitScript(() => {
    // 刪掉 navigator.share，強制走剪貼簿 fallback 路徑
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
  })
}

async function openFirstCardDrawer(page: Page) {
  await page.getByTestId('card-item').first().click()
  await expect(page.getByTestId('card-detail-drawer')).toBeVisible()
}

test.describe('CardDetailDrawer — 文字可選取', () => {
  test.beforeEach(async ({ page }) => {
    // 桌面 viewport：vaul 的 user-select:none 只在 (hover:hover) and (pointer:fine) 命中，
    // 也就是原 bug 只發生在桌面；此處正是為了重現該條件。
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/cards?game=PTCG&language=EN')
    await page.getByTestId('card-grid').waitFor({ timeout: 15000 })
  })

  test('卡名可被選取（user-select 不為 none）', async ({ page }) => {
    await openFirstCardDrawer(page)
    const drawer = page.getByTestId('card-detail-drawer')

    // 對照組（防空測）：drawer 根元素未加 select-text，應仍是 vaul 的 user-select:none。
    // 這同時證明 (hover:hover) and (pointer:fine) 媒體查詢在此環境確實命中——
    // 若沒命中，下面的斷言即使不修 bug 也會通過，測試就失去意義。
    const rootUserSelect = await drawer.evaluate((el) => getComputedStyle(el).userSelect)
    expect(rootUserSelect).toBe('none')

    const title = drawer.locator('[data-slot="drawer-title"]')
    const userSelect = await title.evaluate((el) => getComputedStyle(el).userSelect)
    expect(userSelect).not.toBe('none')
  })

  test('系列／卡號所在資訊區塊可被選取，且標記 data-vaul-no-drag（拖選不會拖走 Drawer）', async ({ page }) => {
    await openFirstCardDrawer(page)
    const infoBlock = page.getByTestId('card-detail-drawer').locator('[data-vaul-no-drag]').first()
    const userSelect = await infoBlock.evaluate((el) => getComputedStyle(el).userSelect)
    expect(userSelect).not.toBe('none')
  })
})

test.describe('CardDetailDrawer — 分享按鈕', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('Web Share 路徑：呼叫 navigator.share 並帶入該卡的獨立 URL', async ({ page }) => {
    await stubWebShare(page)
    await page.goto('/cards?game=PTCG&language=EN')
    await page.getByTestId('card-grid').waitFor({ timeout: 15000 })
    await openFirstCardDrawer(page)

    await page.getByTestId('drawer-share-trigger').click()

    const shared = await page.evaluate(
      () => (window as unknown as { __shared?: ShareData }).__shared,
    )
    expect(shared?.url).toMatch(/\/cards\/ptcg\/en\/.+$/)
    expect(shared?.url?.startsWith(page.url().split('/cards')[0])).toBeTruthy()

    // 系統分享單本身即回饋，不應再跳 toast
    await expect(page.getByText('已複製卡牌連結')).toHaveCount(0)
  })

  test('剪貼簿 fallback 路徑：navigator.share 不存在時複製連結並顯示 toast', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await removeWebShare(page)
    await page.goto('/cards?game=PTCG&language=EN')
    await page.getByTestId('card-grid').waitFor({ timeout: 15000 })
    await openFirstCardDrawer(page)

    await page.getByTestId('drawer-share-trigger').click()

    await expect(page.getByText('已複製卡牌連結')).toBeVisible()
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toMatch(/\/cards\/ptcg\/en\/.+$/)
  })
})

test.describe('CardDetailDrawer — 分享連結來源（硬約束）', () => {
  test.beforeEach(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('從卡冊詳情頁開 Drawer，分享的是「卡片」URL 而非卡冊 URL', async ({ page }) => {
    // 這條守住硬約束：分享連結必須由 card 自身組出，不可取 window.location.href。
    // 在 /cards 上兩者剛好相同、測不出差異；卡冊詳情頁的網址是 /binders/{id}，才能揭露誤用。
    await page.setViewportSize({ width: 1280, height: 800 })
    await stubWebShare(page)
    await loginAs(page, USER)

    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.getByTestId(`slot-card-${slots[0].id}`).hover()
    await view.getByTestId(`slot-view-btn-${slots[0].id}`).click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    await page.getByTestId('drawer-share-trigger').click()

    const shared = await page.evaluate(
      () => (window as unknown as { __shared?: ShareData }).__shared,
    )
    expect(shared?.url).toContain(`/cards/ptcg/en/${encodeURIComponent(card.externalId)}`)
    expect(shared?.url).not.toContain('/binders/')
  })
})
