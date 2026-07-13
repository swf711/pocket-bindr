import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  getUserIdByEmail,
  createBinderWithSlots,
} from './helpers/db'

const USER = getTestUser('navactive')

test.describe('導航 active 樣式 — 當前 route 高亮', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
  })

  test('/cards：「卡牌搜尋」為 active，其餘不 active', async ({ page }) => {
    await page.goto('/cards')
    await expect(page.getByTestId('nav-cards')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('nav-binders')).not.toHaveAttribute('aria-current')
    await expect(page.getByTestId('nav-collection')).not.toHaveAttribute('aria-current')
  })

  test('/binders：「我的卡冊」為 active', async ({ page }) => {
    await page.goto('/binders')
    await expect(page.getByTestId('nav-binders')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('nav-cards')).not.toHaveAttribute('aria-current')
  })

  test('/collection：「我的收藏」為 active', async ({ page }) => {
    await page.goto('/collection')
    await expect(page.getByTestId('nav-collection')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('nav-binders')).not.toHaveAttribute('aria-current')
  })

  test('/binders/[id] 詳情頁：「我的卡冊」仍為 active（子頁高亮父層）', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [])

    await page.goto(`/binders/${binder.id}`)
    await expect(page.getByTestId('nav-binders')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('nav-cards')).not.toHaveAttribute('aria-current')
  })
})
