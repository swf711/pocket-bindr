import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import { clearUserBindersByEmail, getUserIdByEmail } from './helpers/db'
import { prisma } from '../src/lib/prisma'

const USER = getTestUser('binderopt')

test.describe('卡冊列表優化', () => {
  test('無卡冊：顯示空狀態 Card，點「建立第一本卡冊」開啟 Dialog', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await expect(page.getByTestId('empty-binder-state').filter({ visible: true })).toBeVisible()
    await expect(page.getByText('還沒有卡冊').filter({ visible: true })).toBeVisible()
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-name-input').filter({ visible: true })).toBeVisible()
  })

  test('有卡冊（< 3 本）：grid 末位顯示虛線格位，點擊開啟 Dialog', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    await prisma.binder.create({
      data: { userId, name: '已有一本', gridType: 'grid_3x3' },
    })
    await page.goto('/binders')
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()
    await expect(page.getByTestId('add-binder-slot').filter({ visible: true })).toBeVisible()
    await page.getByTestId('add-binder-slot').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-name-input').filter({ visible: true })).toBeVisible()
  })

  test('建立第 3 本後：虛線格位消失，統計顯示「3 / 3 本」', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    await prisma.binder.createMany({
      data: [
        { userId, name: '第一本', gridType: 'grid_3x3' },
        { userId, name: '第二本', gridType: 'grid_3x3' },
      ],
    })
    await page.goto('/binders')
    // 還差一本，虛線格位應存在
    await expect(page.getByTestId('add-binder-slot').filter({ visible: true })).toBeVisible()
    // 建立第三本
    await page.getByTestId('add-binder-slot').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('第三本')
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true })).toHaveCount(3)
    // 虛線格位應消失
    await expect(page.getByTestId('add-binder-slot').filter({ visible: true })).not.toBeVisible()
    // 統計顯示 3 / 3
    await expect(page.getByTestId('binder-count-stat').filter({ visible: true })).toContainText(/3\s*\/\s*3\s*本/)
  })

  test('嘗試透過 API 建立第 4 本：回傳 409 binderLimitReached', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    await prisma.binder.createMany({
      data: [
        { userId, name: '第一本', gridType: 'grid_3x3' },
        { userId, name: '第二本', gridType: 'grid_3x3' },
        { userId, name: '第三本', gridType: 'grid_3x3' },
      ],
    })

    const res = await page.request.post('/api/binders', {
      data: { name: '第四本', gridType: 'grid_3x3' },
    })
    expect(res.status()).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('binderLimitReached')
    expect(body.max).toBe(3)
  })

  test('顏色選擇器顯示 24 個色塊（6 欄）', async ({ page }) => {
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('cover-color-picker').filter({ visible: true }).click()
    // PopoverContent 由 Radix UI portal 渲染，不在 trigger 的 DOM 樹下；直接查全頁色塊按鈕
    const colorButtons = page.locator('button[title^="#"]')
    await expect(colorButtons).toHaveCount(12)
  })
})
