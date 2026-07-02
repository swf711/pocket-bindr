import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  createMultiPageBinder,
  getUserIdByEmail,
  cleanupBinder,
} from './helpers/db'

const USER = getTestUser('cmdpalette')

test.describe('全域命令面板（Cmd/Ctrl+K）', () => {
  test.beforeEach(async () => {
    await clearUserBindersByEmail(USER.email)
  })

  test('Ctrl+K 開啟面板並可導航至 /cards', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/')

    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog')
    const input = dialog.getByPlaceholder('輸入指令或關鍵字…')
    await expect(input).toBeVisible()

    await input.fill('卡牌搜尋')
    await dialog.getByRole('option', { name: '卡牌搜尋' }).click()
    await expect(page).toHaveURL(/\/cards/)
  })

  test('登入態面板含「我的卡冊」，點擊新增卡冊導向 /binders 並開啟建立卡冊 dialog', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/')

    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('option', { name: '我的卡冊' })).toBeVisible()

    await dialog.getByRole('option', { name: '新增卡冊' }).click()
    await expect(page).toHaveURL(/\/binders$/)
    await expect(page.getByTestId('binder-name-input')).toBeVisible()
  })

  test('未登入時面板不顯示受保護導航項與新增卡冊', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByPlaceholder('輸入指令或關鍵字…')).toBeVisible()
    await expect(dialog.getByRole('option', { name: '我的卡冊' })).toHaveCount(0)
    await expect(dialog.getByRole('option', { name: '我的收藏' })).toHaveCount(0)
    await expect(dialog.getByRole('option', { name: '新增卡冊' })).toHaveCount(0)
  })
})

test.describe('卡冊方向鍵翻頁', () => {
  test.beforeEach(async () => {
    await clearUserBindersByEmail(USER.email)
  })

  test('ArrowRight/ArrowLeft 於桌面翻頁；查看卡牌 Drawer 開啟時不誤翻', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder, slots } = await createMultiPageBinder(userId, { pageCount: 4 })

    try {
      await page.goto(`/binders/${binder.id}`)
      const spreadView = page.getByTestId('binder-spread-view')
      const pageLabel = spreadView.getByText(/^\d+ \/ \d+$/)
      await expect(pageLabel).toHaveText('1 / 3')

      await page.keyboard.press('ArrowRight')
      await expect(pageLabel).toHaveText('2 / 3')

      await page.keyboard.press('ArrowLeft')
      await expect(pageLabel).toHaveText('1 / 3')

      // 開啟查看卡牌 Drawer 後，方向鍵不應再翻卡冊頁
      const firstSlot = slots.find((s) => s.pageNumber === 1)!
      const view = page.getByTestId('binder-spread-view')
      await view.getByTestId(`slot-card-${firstSlot.id}`).hover()
      await view.getByTestId(`slot-view-btn-${firstSlot.id}`).click()
      await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

      await page.keyboard.press('ArrowRight')
      await expect(pageLabel).toHaveText('1 / 3')
    } finally {
      await cleanupBinder(binder.id)
    }
  })
})
