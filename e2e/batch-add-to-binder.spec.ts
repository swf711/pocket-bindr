// Requires running server and test database
import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  createBinderNearPageLimit,
  getUserIdByEmail,
} from './helpers/db'

const USER = getTestUser('batchaddbinder')

test.describe('批次加入卡冊', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)

    const res = await page.request.post('/api/binders', {
      data: { name: 'E2E Batch Binder', gridType: 'grid_4x4' },
    })
    expect(res.status()).toBe(201)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('進多選模式後點卡＝勾選，不開 modal', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('batch-select-mode-toggle').click()
    await page.getByTestId('card-item').first().click()

    // 多選模式下點卡是勾選，不應觸發攔截 modal
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByTestId('card-item').first()).toHaveAttribute('data-selected', 'true')
  })

  test('勾選多張 → 底部 bar 顯示已選數 → 送出成功 → 卡冊內確認已加入', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('batch-select-mode-toggle').click()
    await page.getByTestId('card-item').nth(0).click()
    await page.getByTestId('card-item').nth(1).click()

    const bar = page.getByTestId('batch-add-bar')
    await expect(bar).toBeVisible()
    await expect(page.getByTestId('batch-selected-count')).toContainText('2')

    await page.getByTestId('batch-binder-select').click()
    await page.getByRole('option', { name: 'E2E Batch Binder' }).click()

    const ownedToggle = page.getByTestId('batch-status-owned')
    if (await ownedToggle.isVisible()) await ownedToggle.click()

    await page.getByTestId('batch-submit-btn').click()

    await expect(page.getByText(/已將 2 張卡加入卡冊/)).toBeVisible({ timeout: 8000 })
    // 送出成功後應退出多選模式、bar 消失
    await expect(bar).not.toBeVisible()

    const bindersRes = await page.request.get('/api/binders')
    expect(bindersRes.status()).toBe(200)
    const binders = await bindersRes.json()
    const list = Array.isArray(binders) ? binders : binders.binders
    const binder = list.find((b: { name: string }) => b.name === 'E2E Batch Binder')
    expect(binder).toBeTruthy()

    const detailRes = await page.request.get(`/api/binders/${binder.id}`)
    expect(detailRes.status()).toBe(200)
    const detail = await detailRes.json()
    const filledSlots = (detail.slots ?? []).filter((s: { cardId: string | null }) => s.cardId !== null)
    expect(filledSlots.length).toBe(2)
  })

  test('退出多選模式時清空已選', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('batch-select-mode-toggle').click()
    await page.getByTestId('card-item').first().click()
    await expect(page.getByTestId('batch-add-bar')).toBeVisible()

    // 退出多選模式應清空選取、bar 隨之消失
    await page.getByTestId('batch-select-mode-toggle').click()
    await expect(page.getByTestId('batch-add-bar')).not.toBeVisible()

    // 再次進入多選模式為全新選取狀態（非殘留上次的選取）
    await page.getByTestId('batch-select-mode-toggle').click()
    await expect(page.getByTestId('batch-add-bar')).not.toBeVisible()
  })

  test('切頁保留已選 + 跨頁累積後可一次送出', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('batch-select-mode-toggle').click()
    await page.getByTestId('card-item').nth(0).click()
    await page.getByTestId('card-item').nth(1).click()
    await expect(page.getByTestId('batch-selected-count')).toContainText('2')

    const page1FirstHref = await page.getByTestId('card-item').first().getAttribute('href')

    // 切到第 2 頁（頂部分頁）
    const [pageTwoRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/cards') && r.url().includes('page=2')),
      page.getByTestId('card-pagination-top').getByRole('link', { name: 'Go to next page' }).click(),
    ])
    expect(pageTwoRes.ok()).toBeTruthy()
    // React Query 用 keepPreviousData：網路回應 resolve 後畫面才重繪成第 2 頁格線，
    // 需等格線內容真的換掉（首卡 href 改變）才能點卡，避免誤點到還沒替換的舊頁卡片
    await expect(page.getByTestId('card-item').first()).not.toHaveAttribute('href', page1FirstHref ?? '')

    // 已選數量應保留（跨頁累積，非切頁即清空）
    await expect(page.getByTestId('batch-selected-count')).toContainText('2')

    await page.getByTestId('card-item').nth(0).click()
    await expect(page.getByTestId('batch-selected-count')).toContainText('3')

    await page.getByTestId('batch-binder-select').click()
    await page.getByRole('option', { name: 'E2E Batch Binder' }).click()

    const ownedToggle = page.getByTestId('batch-status-owned')
    if (await ownedToggle.isVisible()) await ownedToggle.click()

    await page.getByTestId('batch-submit-btn').click()

    await expect(page.getByText(/已將 3 張卡加入卡冊/)).toBeVisible({ timeout: 8000 })

    const bindersRes = await page.request.get('/api/binders')
    const binders = await bindersRes.json()
    const list = Array.isArray(binders) ? binders : binders.binders
    const binder = list.find((b: { name: string }) => b.name === 'E2E Batch Binder')
    const detailRes = await page.request.get(`/api/binders/${binder.id}`)
    const detail = await detailRes.json()
    const filledSlots = (detail.slots ?? []).filter((s: { cardId: string | null }) => s.cardId !== null)
    expect(filledSlots.length).toBe(3)
  })

  test('切頁後捲動回頁面頂端', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    // 捲到底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

    const [pageTwoRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/cards') && r.url().includes('page=2')),
      page.getByRole('link', { name: 'Go to next page' }).last().click(),
    ])
    expect(pageTwoRes.ok()).toBeTruthy()

    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeLessThan(50)
  })
})

test.describe('批次加入卡冊 - 撞頁數上限', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('批次加入 2 張卡撞上限時整批拒絕，顯示容量不足 toast', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    // 只差最後一格就滿：加入 1 張可成功，加入 2 張以上必撞頂
    await createBinderNearPageLimit(userId, 'grid_1x2')

    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('batch-select-mode-toggle').click()
    await page.getByTestId('card-item').nth(0).click()
    await page.getByTestId('card-item').nth(1).click()

    await page.getByTestId('batch-binder-select').click()
    await page.getByRole('option', { name: 'E2E Near-Limit Binder' }).click()

    await page.getByTestId('batch-submit-btn').click()

    await expect(page.getByText(/卡冊頁數已滿/)).toBeVisible({ timeout: 8000 })
    // 撞上限應整批拒絕，bar 仍在（未成功退出多選模式）
    await expect(page.getByTestId('batch-add-bar')).toBeVisible()
  })
})

test.describe('批次加入卡冊 - 手機版底部 Drawer', () => {
  // 窄視窗（< 768px）觸發 useIsMobile → 控制項改走底部 Drawer
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)

    const res = await page.request.post('/api/binders', {
      data: { name: 'E2E Mobile Binder', gridType: 'grid_4x4' },
    })
    expect(res.status()).toBe(201)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('手機：勾選 → bar 只放「加入」→ 點開底部 Drawer 設定 → 送出成功', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    await page.getByTestId('batch-select-mode-toggle').click()
    await page.getByTestId('card-item').nth(0).click()
    await page.getByTestId('card-item').nth(1).click()

    const bar = page.getByTestId('batch-add-bar')
    await expect(bar).toBeVisible()
    await expect(page.getByTestId('batch-selected-count')).toContainText('2')

    // 手機版：控制項不在 strip，需點「加入」開 Drawer
    await expect(page.getByTestId('batch-binder-select')).toHaveCount(0)
    await page.getByTestId('batch-open-drawer').click()

    const drawer = page.getByTestId('batch-add-drawer')
    await expect(drawer).toBeVisible()

    await page.getByTestId('batch-binder-select').click()
    await page.getByRole('option', { name: 'E2E Mobile Binder' }).click()

    const ownedToggle = page.getByTestId('batch-status-owned')
    if (await ownedToggle.isVisible()) await ownedToggle.click()

    await page.getByTestId('batch-submit-btn').click()

    await expect(page.getByText(/已將 2 張卡加入卡冊/)).toBeVisible({ timeout: 8000 })
    // 送出成功後退出多選模式、bar 與 Drawer 皆消失
    await expect(bar).not.toBeVisible()

    const bindersRes = await page.request.get('/api/binders')
    const binders = await bindersRes.json()
    const list = Array.isArray(binders) ? binders : binders.binders
    const binder = list.find((b: { name: string }) => b.name === 'E2E Mobile Binder')
    const detailRes = await page.request.get(`/api/binders/${binder.id}`)
    const detail = await detailRes.json()
    const filledSlots = (detail.slots ?? []).filter((s: { cardId: string | null }) => s.cardId !== null)
    expect(filledSlots.length).toBe(2)
  })
})
