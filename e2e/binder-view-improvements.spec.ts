import { test, expect } from '@playwright/test'
import { prisma } from '../src/lib/prisma'
import { getTestUser, loginAs } from './helpers/auth'
import { getUserIdByEmail, createMultiPageBinder, cleanupBinder, getTwoCardIds } from './helpers/db'

const USER = getTestUser('binderviewimprove')

test.describe('卡冊詳情頁改善', () => {
  test('詳情頁顯示返回按鈕，點擊後導向 /binders', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const backBtn = page.getByTestId('back-to-binders')
      await expect(backBtn).toBeVisible()
      await backBtn.click()
      await expect(page).toHaveURL(/\/binders$/)
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('內頁面板背景為黑色', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const spreadView = page.getByTestId('spread-drag-container')
      await expect(spreadView).toBeVisible()
      const panel = spreadView.locator('> div').first()
      const bg = await panel.evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(bg).toBe('rgb(0, 0, 0)')
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('內頁面板外框顏色與 coverColor 一致', async ({ page }) => {
    const coverColor = '#2C5282'
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { coverColor, pageCount: 1 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const spreadView = page.getByTestId('spread-drag-container')
      await expect(spreadView).toBeVisible()
      const panel = spreadView.locator('> div').first()
      const borderColor = await panel.evaluate((el) => getComputedStyle(el).borderColor)
      // #2C5282 = rgb(44, 82, 130)
      expect(borderColor).toBe('rgb(44, 82, 130)')
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('Settings Drawer 內頁列表顯示拖拉 handle', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 2 })
    try {
      await page.goto(`/binders/${binder.id}`)
      await page.getByTestId('binder-settings-btn').click()
      const handle1 = page.getByTestId('page-drag-handle-1')
      const handle2 = page.getByTestId('page-drag-handle-2')
      await expect(handle1).toBeVisible()
      await expect(handle2).toBeVisible()
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('拖拉調整內頁順序後 DB slot 換頁', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const [cardId1, cardId2] = await getTwoCardIds()

    // 建立 2 頁 binder：card1 在 page1，card2 在 page2
    const binder = await prisma.binder.create({
      data: { userId, name: 'DnD Page Reorder Test', gridType: 'grid_3x3', coverColor: '#2C5282' },
    })
    await prisma.userCard.createMany({
      data: [
        { userId, cardId: cardId1, status: 'owned', quantity: 1 },
        { userId, cardId: cardId2, status: 'owned', quantity: 1 },
      ],
    })
    const slot1 = await prisma.binderSlot.create({
      data: { binderId: binder.id, cardId: cardId1, status: 'owned', pageNumber: 1, slotIndex: 0 },
    })
    const slot2 = await prisma.binderSlot.create({
      data: { binderId: binder.id, cardId: cardId2, status: 'owned', pageNumber: 2, slotIndex: 0 },
    })

    try {
      await page.goto(`/binders/${binder.id}`)
      await page.getByTestId('binder-settings-btn').click()

      const list = page.getByTestId('page-manager-list')
      await expect(list).toBeVisible()

      // drag page row 2 up to page row 1
      const row1 = page.getByTestId('page-manager-row-1')
      const row2 = page.getByTestId('page-manager-row-2')
      await expect(row1).toBeVisible()
      await expect(row2).toBeVisible()

      const handle2 = page.getByTestId('page-drag-handle-2')
      const row1Box = await row1.boundingBox()
      const handle2Box = await handle2.boundingBox()
      if (!row1Box || !handle2Box) throw new Error('no bounding box')

      // drag handle2 up to row1 position
      const hx = handle2Box.x + handle2Box.width / 2
      const hy = handle2Box.y + handle2Box.height / 2
      await page.mouse.move(hx, hy)
      await page.mouse.down()
      await page.mouse.move(hx, hy - 8, { steps: 3 })
      await page.mouse.move(hx, row1Box.y + row1Box.height / 2, { steps: 15 })
      await page.mouse.up()

      // DB poll: slot2 (originally on page 2) should now be on page 1
      await expect
        .poll(
          async () => {
            const s = await prisma.binderSlot.findUnique({ where: { id: slot2.id }, select: { pageNumber: true } })
            return s?.pageNumber
          },
          { timeout: 8000 },
        )
        .toBe(1)

      // slot1 (originally on page 1) should now be on page 2
      const s1 = await prisma.binderSlot.findUnique({ where: { id: slot1.id }, select: { pageNumber: true } })
      expect(s1?.pageNumber).toBe(2)
    } finally {
      await prisma.binder.delete({ where: { id: binder.id } }).catch(() => {})
      await prisma.userCard.deleteMany({ where: { userId, cardId: { in: [cardId1, cardId2] } } })
    }
  })
})
