import { test, expect } from '@playwright/test'
import { prisma } from '../src/lib/prisma'
import { loginAsTestUser, TEST_USER } from './helpers/auth'
import { createMultiPageBinder, cleanupBinder } from './helpers/db'

async function getTestUserId(page: import('@playwright/test').Page): Promise<string> {
  // Test user is created during loginAsTestUser if missing
  const user = await prisma.user.findUniqueOrThrow({ where: { email: TEST_USER.email } })
  void page
  return user.id
}

test.describe('Binder Spread Layout - 封面顏色', () => {
  test('建立卡冊時可選擇封面顏色，列表頁封面套用該顏色', async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/binders')

    const name = `顏色測試冊-${Date.now()}`
    await page.getByTestId('create-binder-btn').click()
    await page.getByTestId('binder-name-input').fill(name)
    await page.getByTestId('cover-color-picker').click()
    await page.locator('[title="#2C5282"]').first().click()
    await page.getByTestId('create-binder-submit').click()

    const card = page.getByTestId('binder-card').filter({ hasText: name })
    await expect(card).toBeVisible()
    const bgColor = await card.evaluate((el) => (el as HTMLElement).style.backgroundColor)
    // #2C5282 = rgb(44, 82, 130)
    expect(bgColor).toBe('rgb(44, 82, 130)')

    // cleanup
    await prisma.binder.deleteMany({ where: { name } })
  })

  test('編輯卡冊封面顏色，列表頁即時更新', async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/binders')

    const name = `編輯顏色冊-${Date.now()}`
    await page.getByTestId('create-binder-btn').click()
    await page.getByTestId('binder-name-input').fill(name)
    await page.getByTestId('create-binder-submit').click()

    const card = page.getByTestId('binder-card').filter({ hasText: name })
    await expect(card).toBeVisible()

    await card.getByTestId('edit-binder-btn').click()
    await page.getByTestId('cover-color-picker').click()
    await page.locator('[title="#9B2C2C"]').first().click()
    await page.getByTestId('edit-binder-submit').click()

    // Color updates immediately in the list
    await expect(async () => {
      const bgColor = await card.evaluate((el) => (el as HTMLElement).style.backgroundColor)
      // #9B2C2C = rgb(155, 44, 44)
      expect(bgColor).toBe('rgb(155, 44, 44)')
    }).toPass({ timeout: 5000 })

    // cleanup
    await prisma.binder.deleteMany({ where: { name } })
  })
})

test.describe('Binder Spread Layout - 桌面雙頁', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('桌面：進入卡冊顯示 Spread 0（內封面 + Page 1）', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId(page)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 2 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const spreadView = page.getByTestId('binder-spread-view')
      await expect(spreadView).toBeVisible()
      await expect(spreadView.getByTestId('binder-cover-panel')).toBeVisible()
      await expect(spreadView.getByText('第 1 頁')).toBeVisible()
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('桌面：點擊下一頁切換至 Spread 1，上一頁按鈕變為可點擊', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId(page)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 3 })
    try {
      await page.goto(`/binders/${binder.id}`)
      await expect(page.getByTestId('spread-prev-btn')).toBeDisabled()
      await page.getByTestId('spread-next-btn').click()
      await expect(page.getByTestId('spread-prev-btn')).toBeEnabled()
      const spreadView = page.getByTestId('binder-spread-view')
      await expect(spreadView.getByText('第 2 頁')).toBeVisible()
      await expect(spreadView.getByText('第 3 頁')).toBeVisible()
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('桌面：Spread 0 時上一頁按鈕為 disabled', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId(page)
    const { binder } = await createMultiPageBinder(userId)
    try {
      await page.goto(`/binders/${binder.id}`)
      await expect(page.getByTestId('spread-prev-btn')).toBeDisabled()
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test.skip('桌面：跨頁拖拉懸停邊緣自動翻頁並完成放置（需真實瀏覽器 pointer events，暫時 skip，沿用既有 DnD E2E skip 慣例）', async () => {
    // TODO: implement when pointer event simulation is reliable in CI
  })
})

test.describe('Binder Spread Layout - 行動裝置', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('行動裝置（viewport 模擬）：一次顯示一頁，初始為內封面', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId(page)
    const { binder } = await createMultiPageBinder(userId)
    try {
      await page.goto(`/binders/${binder.id}`)
      const mobileView = page.getByTestId('binder-mobile-view')
      await expect(mobileView).toBeVisible()
      await expect(mobileView.getByTestId('binder-cover-panel')).toBeVisible()
      await expect(page.getByTestId('binder-spread-view')).toBeHidden()
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('行動裝置：swipe 切換頁面', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId(page)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 2 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const mobileView = page.getByTestId('binder-mobile-view')
      await expect(mobileView).toBeVisible()
      // Initially on cover
      await expect(mobileView.getByTestId('binder-cover-panel')).toBeVisible()

      // Swipe left (next page) via touchscreen
      const box = await mobileView.boundingBox()
      expect(box).not.toBeNull()
      const startX = box!.x + box!.width * 0.8
      const endX = box!.x + box!.width * 0.2
      const y = box!.y + box!.height / 2
      await page.touchscreen.tap(startX, y) // ensure touch context
      // Dispatch swipe via touch events
      await mobileView.dispatchEvent('touchstart', {
        touches: [{ identifier: 0, clientX: startX, clientY: y }],
        changedTouches: [{ identifier: 0, clientX: startX, clientY: y }],
      })
      await mobileView.dispatchEvent('touchend', {
        touches: [],
        changedTouches: [{ identifier: 0, clientX: endX, clientY: y }],
      })

      // Now should show page 1
      await expect(mobileView.getByText('第 1 頁')).toBeVisible()
    } finally {
      await cleanupBinder(binder.id)
    }
  })
})
