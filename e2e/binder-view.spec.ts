import { test, expect } from '@playwright/test'
import { prisma } from '../src/lib/prisma'
import { getTestUser, loginAs } from './helpers/auth'
import { getUserIdByEmail, createBinderWithSlots, cleanupBinder, getTwoCardIds } from './helpers/db'
import { dragSlotTo } from './helpers/drag'

const USER = getTestUser('binderview')

async function getAnyCardId(): Promise<string> {
  // 需要有圖片的卡牌，否則 SlotCard 會渲染文字 fallback 而非 <img>
  const card = await prisma.card.findFirstOrThrow({ where: { imageSmall: { not: '' } } })
  return card.id
}

test.describe('卡冊格位檢視頁', () => {
  test('未登入存取他人卡冊導向 /binders', async ({ page }) => {
    await page.goto('/binders/nonexistent-binder-id')
    await expect(page).toHaveURL(/\/login|\/binders/)
  })

  test('登入後存取不存在或他人卡冊導向 /binders', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/binders/nonexistent-binder-id')
    await expect(page).toHaveURL(/\/binders/)
  })

  test('grid_3x3 卡冊正確顯示 9 格/頁', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
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
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
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
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
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
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
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
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
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
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
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

  test.describe('格位拖拉（DnD）', () => {
    // 桌面 viewport 確保走 BinderSpreadView（hidden md:flex）
    test.use({ viewport: { width: 1280, height: 800 } })

    test('拖拉兩個有卡格位互換位置', async ({ page }) => {
      await loginAs(page, USER)
      const userId = await getUserIdByEmail(USER.email)
      const [cardA, cardB] = await getTwoCardIds()
      const { binder, slots } = await createBinderWithSlots(userId, 'grid_3x3', [
        { cardId: cardA, status: 'owned', pageNumber: 1, slotIndex: 0 },
        { cardId: cardB, status: 'owned', pageNumber: 1, slotIndex: 4 },
      ])
      try {
        await page.goto(`/binders/${binder.id}`)
        const spread = page.getByTestId('binder-spread-view')
        const source = spread.getByTestId(`slot-card-${slots[0].id}`)
        const target = spread.getByTestId(`slot-card-${slots[1].id}`)
        await expect(source).toBeVisible()
        await expect(target).toBeVisible()

        await dragSlotTo(page, source, target)

        // optimistic update 可能回滾，最終以 DB 為準
        await expect
          .poll(async () => {
            const a = await prisma.binderSlot.findUniqueOrThrow({ where: { id: slots[0].id } })
            const b = await prisma.binderSlot.findUniqueOrThrow({ where: { id: slots[1].id } })
            return [a.slotIndex, b.slotIndex]
          })
          .toEqual([4, 0])
      } finally {
        await cleanupBinder(binder.id)
      }
    })

    test('拖拉有卡格位到空格位，原格位變空', async ({ page }) => {
      await loginAs(page, USER)
      const userId = await getUserIdByEmail(USER.email)
      const [cardA] = await getTwoCardIds()
      const { binder, slots } = await createBinderWithSlots(userId, 'grid_3x3', [
        { cardId: cardA, status: 'owned', pageNumber: 1, slotIndex: 0 },
      ])
      try {
        await page.goto(`/binders/${binder.id}`)
        const spread = page.getByTestId('binder-spread-view')
        const source = spread.getByTestId(`slot-card-${slots[0].id}`)
        const target = spread.locator('[data-page="1"][data-index="5"]')
        await expect(source).toBeVisible()
        await expect(target).toBeVisible()

        await dragSlotTo(page, source, target)

        await expect
          .poll(async () => {
            const s = await prisma.binderSlot.findUniqueOrThrow({ where: { id: slots[0].id } })
            return { pageNumber: s.pageNumber, slotIndex: s.slotIndex }
          })
          .toEqual({ pageNumber: 1, slotIndex: 5 })

        // 原格位（page 1, index 0）變回空格位
        await expect(spread.locator('[data-page="1"][data-index="0"]')).toBeVisible()
      } finally {
        await cleanupBinder(binder.id)
      }
    })
  })
})
