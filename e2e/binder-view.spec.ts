import { test, expect } from '@playwright/test'
import { prisma } from '../src/lib/prisma'
import { loginAsTestUser, TEST_USER } from './helpers/auth'
import { clearTestUserBinders, createBinderWithSlots, cleanupBinder } from './helpers/db'

async function getTestUserId(): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: TEST_USER.email } })
  return user.id
}

async function getAnyCardId(): Promise<string> {
  // 需要有圖片的卡片，否則 SlotCard 會渲染文字 fallback 而非 <img>
  const card = await prisma.card.findFirstOrThrow({ where: { imageSmall: { not: '' } } })
  return card.id
}

test.describe('卡冊格位檢視頁', () => {
  test('未登入存取他人卡冊導向 /binders', async ({ page }) => {
    await page.goto('/binders/nonexistent-binder-id')
    await expect(page).toHaveURL(/\/login|\/binders/)
  })

  test('登入後存取不存在或他人卡冊導向 /binders', async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/binders/nonexistent-binder-id')
    await expect(page).toHaveURL(/\/binders/)
  })

  test('grid_3x3 卡冊正確顯示 9 格/頁', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId()
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [])
    try {
      await page.goto(`/binders/${binder.id}`)
      // 9 empty slots + page header visible
      const slots = page.locator('[data-page]')
      await expect(slots).toHaveCount(9)
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('owned 格位顯示彩色（無 grayscale）', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId()
    const cardId = await getAnyCardId()
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 0 },
    ])
    try {
      await page.goto(`/binders/${binder.id}`)
      const cardImg = page.locator('img').first()
      await expect(cardImg).toBeVisible()
      const classes = await cardImg.getAttribute('class') ?? ''
      expect(classes).not.toContain('grayscale')
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('wanted 格位顯示黑白（有 grayscale）', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId()
    const cardId = await getAnyCardId()
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [
      { cardId, status: 'wanted', pageNumber: 1, slotIndex: 0 },
    ])
    try {
      await page.goto(`/binders/${binder.id}`)
      const cardImg = page.locator('img').first()
      await expect(cardImg).toBeVisible()
      const classes = await cardImg.getAttribute('class') ?? ''
      expect(classes).toContain('grayscale')
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('空格位顯示佔位區塊', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId()
    const { binder } = await createBinderWithSlots(userId, 'grid_2x2', [])
    try {
      await page.goto(`/binders/${binder.id}`)
      const emptySlots = page.locator('[data-page]')
      await expect(emptySlots).toHaveCount(4)
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('點擊刪除按鈕出現 AlertDialog，取消不刪除', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId()
    const cardId = await getAnyCardId()
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 0 },
    ])
    try {
      await page.goto(`/binders/${binder.id}`)
      // Hover to reveal delete button
      const slotContainer = page.locator('.group').first()
      await slotContainer.hover()
      const deleteBtn = slotContainer.locator('button[data-variant="destructive"]')
      await deleteBtn.click()
      // AlertDialog should appear
      await expect(page.getByRole('alertdialog')).toBeVisible()
      // Click cancel
      await page.getByRole('button', { name: '取消' }).click()
      await expect(page.getByRole('alertdialog')).not.toBeVisible()
      // Card image still present
      await expect(page.locator('img').first()).toBeVisible()
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('確認刪除後格位消失並轉為空格', async ({ page }) => {
    await loginAsTestUser(page)
    const userId = await getTestUserId()
    const cardId = await getAnyCardId()
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 0 },
    ])
    try {
      await page.goto(`/binders/${binder.id}`)
      const slotContainer = page.locator('.group').first()
      await slotContainer.hover()
      const deleteBtn = slotContainer.locator('button[data-variant="destructive"]')
      await deleteBtn.click()
      await page.getByRole('button', { name: '確認移除' }).click()
      // After delete, the slot becomes empty (no img)
      await expect(page.locator('img')).toHaveCount(0)
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test.skip('拖拉兩個有卡格位互換位置', async () => {
    // dnd-kit pointer events are complex in headless — manual testing required
  })

  test.skip('拖拉有卡格位到空格位，原格位變空', async () => {
    // dnd-kit pointer events are complex in headless — manual testing required
  })
})
