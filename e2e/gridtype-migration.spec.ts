import { test, expect } from '@playwright/test'
import { prisma } from '../src/lib/prisma'
import { getTestUser, loginAs } from './helpers/auth'
import { getUserIdByEmail, createBinderWithSlots, cleanupBinder } from './helpers/db'
import { clearUserBindersByEmail } from './helpers/db'

const USER = getTestUser('gridtypemigration')

async function getAnyCardId(): Promise<string> {
  const card = await prisma.card.findFirstOrThrow({ where: { imageSmall: { not: '' } } })
  return card.id
}

test.beforeEach(async ({ page }) => {
  await loginAs(page, USER)
})

test.afterAll(async () => {
  await clearUserBindersByEmail(USER.email)
})

test.describe('gridType migration — SettingsDrawer', () => {
  test('Scenario A：grid_4x4 → grid_1x2，越界 slots 搬移至新頁並顯示 toast', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const cardId = await getAnyCardId()

    // 建立 grid_4x4 卡冊，page 1 有 slotIndex 0~3（其中 2、3 越界 grid_1x2）
    const { binder } = await createBinderWithSlots(userId, 'grid_4x4', [
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 0 },
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 1 },
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 2 },
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 3 },
    ])

    try {
      await page.goto(`/binders/${binder.id}`)
      await page.waitForLoadState('networkidle')

      // 開啟 Settings Drawer
      await page.getByTestId('binder-settings-btn').click()
      await expect(page.getByTestId('drawer-grid-toggle')).toBeVisible()

      // 選擇 grid_1x2（1×2）
      await page.getByTestId('drawer-grid-toggle').getByText('1×2').click()

      // 儲存設定
      await page.getByTestId('drawer-save-settings-btn').click()

      // 確認 toast 顯示搬移訊息
      await expect(page.getByText(/格式已更新.+張卡牌已搬移/)).toBeVisible({ timeout: 8000 })

      // DB poll：確認 slotIndex 2, 3 已搬移到 pageNumber > 1
      await expect.poll(async () => {
        const slots = await prisma.binderSlot.findMany({
          where: { binderId: binder.id },
          select: { pageNumber: true, slotIndex: true },
        })
        return slots.filter((s) => s.pageNumber > 1).length
      }, { timeout: 5000 }).toBe(2)
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('Scenario C：grid_2x2 → grid_4x4（放大），無 migration，顯示一般 toast', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const cardId = await getAnyCardId()

    const { binder } = await createBinderWithSlots(userId, 'grid_2x2', [
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 0 },
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 1 },
    ])

    try {
      await page.goto(`/binders/${binder.id}`)
      await page.waitForLoadState('networkidle')

      await page.getByTestId('binder-settings-btn').click()
      await expect(page.getByTestId('drawer-grid-toggle')).toBeVisible()

      await page.getByTestId('drawer-grid-toggle').getByText('4×4').click()
      await page.getByTestId('drawer-save-settings-btn').click()

      // 應顯示一般成功 toast，無搬移訊息
      await expect(page.getByText('設定已儲存')).toBeVisible({ timeout: 5000 })

      // DB poll：所有 slots 仍在 pageNumber 1
      await expect.poll(async () => {
        const slots = await prisma.binderSlot.findMany({
          where: { binderId: binder.id },
          select: { pageNumber: true },
        })
        return slots.every((s) => s.pageNumber === 1)
      }, { timeout: 5000 }).toBe(true)
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('Scenario D：grid_4x4 → grid_2x2 縮小，但無越界 slots，顯示一般 toast', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const cardId = await getAnyCardId()

    // slotIndex 0, 1 均在 grid_2x2（4 格/頁）範圍內
    const { binder } = await createBinderWithSlots(userId, 'grid_4x4', [
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 0 },
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 1 },
    ])

    try {
      await page.goto(`/binders/${binder.id}`)
      await page.waitForLoadState('networkidle')

      await page.getByTestId('binder-settings-btn').click()
      await expect(page.getByTestId('drawer-grid-toggle')).toBeVisible()

      await page.getByTestId('drawer-grid-toggle').getByText('2×2').click()
      await page.getByTestId('drawer-save-settings-btn').click()

      await expect(page.getByText('設定已儲存')).toBeVisible({ timeout: 5000 })
    } finally {
      await cleanupBinder(binder.id)
    }
  })
})

test.describe('gridType migration — EditBinderDialog', () => {
  test('Scenario B：grid_3x3 → grid_2x2，越界 slots 搬移至新頁並顯示 toast', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const cardId = await getAnyCardId()

    // page 1, slotIndex 0-5（grid_2x2=4格/頁，slotIndex 4, 5 越界）
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 0 },
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 1 },
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 2 },
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 3 },
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 4 },
      { cardId, status: 'owned', pageNumber: 1, slotIndex: 5 },
    ])

    try {
      await page.goto('/binders')
      await page.waitForLoadState('networkidle')

      // hover 顯示 edit 按鈕
      const binderCard = page.getByTestId('binder-card').filter({
        has: page.locator(`[data-testid="enter-binder-btn"][href="/binders/${binder.id}"]`),
      })
      await binderCard.hover()
      await page.getByTestId('edit-binder-btn').first().click()

      await expect(page.getByTestId('edit-binder-dialog')).toBeVisible()

      // 開啟 Select 並選擇 grid_2x2
      await page.getByTestId('binder-grid-select').click()
      await page.getByRole('option', { name: /2 × 2/ }).click()

      await page.getByTestId('edit-binder-submit').click()

      // 確認搬移 toast
      await expect(page.getByText(/格式已更新.+張卡牌已搬移/)).toBeVisible({ timeout: 8000 })

      // DB poll：slotIndex 4, 5 已搬移到 pageNumber > 1
      await expect.poll(async () => {
        const slots = await prisma.binderSlot.findMany({
          where: { binderId: binder.id },
          select: { pageNumber: true, slotIndex: true },
        })
        return slots.filter((s) => s.pageNumber > 1).length
      }, { timeout: 5000 }).toBe(2)
    } finally {
      await cleanupBinder(binder.id)
    }
  })
})
