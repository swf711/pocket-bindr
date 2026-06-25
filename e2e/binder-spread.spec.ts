import { test, expect } from '@playwright/test'
import { prisma } from '../src/lib/prisma'
import { getTestUser, loginAs } from './helpers/auth'
import { getUserIdByEmail, createMultiPageBinder, cleanupBinder, clearUserBindersByEmail } from './helpers/db'
import { startDrag, dropOn } from './helpers/drag'

const USER = getTestUser('binderspread')

// 提升至 file 層級：三個 describe block（封面顏色／桌面雙頁／行動裝置）每個 test 前都清空
// binderspread 帳號卡冊，消除前次失敗 run 留下的孤兒卡冊累積撞 MAX_BINDERS。
test.beforeEach(async () => {
  await clearUserBindersByEmail(USER.email)
})

test.describe('Binder Spread Layout - 封面顏色', () => {
  test('建立卡冊時可選擇封面顏色，列表頁封面套用該顏色', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/binders')

    const name = `顏色測試冊-${Date.now()}`
    // 可能是空狀態按鈕或有卡冊時的 add-binder-slot
    await page.getByTestId('add-binder-slot')
      .or(page.getByRole('button', { name: '建立第一本卡冊' }))
      .first()
      .click()
    await page.getByTestId('binder-name-input').fill(name)
    await page.getByTestId('cover-color-picker').click()
    await page.locator('[title="#2563EB"]').first().click()
    await page.getByTestId('create-binder-submit').click()

    const card = page.getByTestId('binder-card').filter({ hasText: name })
    await expect(card).toBeVisible()
    // coverColor 套用在 binder-spine 子元素的 inline style 上
    const bgColor = await card.getByTestId('binder-spine').evaluate((el) => (el as HTMLElement).style.backgroundColor)
    // #2563EB = rgb(37, 99, 235)
    expect(bgColor).toBe('rgb(37, 99, 235)')

    // cleanup
    await prisma.binder.deleteMany({ where: { name } })
  })

  test('編輯卡冊封面顏色，列表頁即時更新', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/binders')

    const name = `編輯顏色冊-${Date.now()}`
    // 可能是空狀態按鈕或有卡冊時的 add-binder-slot
    await page.getByTestId('add-binder-slot')
      .or(page.getByRole('button', { name: '建立第一本卡冊' }))
      .first()
      .click()
    await page.getByTestId('binder-name-input').fill(name)
    await page.getByTestId('create-binder-submit').click()

    const card = page.getByTestId('binder-card').filter({ hasText: name })
    await expect(card).toBeVisible()

    await card.hover()
    await card.getByTestId('binder-more-btn').click()
    await page.getByTestId('edit-binder-btn').click()
    await page.getByTestId('cover-color-picker').click()
    // 色票有 hover:scale-110 + Popover 進場動畫，Playwright 穩定性檢查會與動畫互斥；force 略過
    await page.locator('[title="#DC2626"]').first().click({ force: true })
    await page.getByTestId('edit-binder-submit').click()

    // Color updates immediately in the list
    await expect(async () => {
      // coverColor 套用在 binder-spine 子元素的 inline style 上
      const bgColor = await card.getByTestId('binder-spine').evaluate((el) => (el as HTMLElement).style.backgroundColor)
      // #DC2626 = rgb(220, 38, 38)
      expect(bgColor).toBe('rgb(220, 38, 38)')
    }).toPass({ timeout: 5000 })

    // cleanup
    await prisma.binder.deleteMany({ where: { name } })
  })
})

test.describe('Binder Spread Layout - 桌面雙頁', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('桌面：進入卡冊顯示 Spread 0（內封面 + Page 1）', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
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
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
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
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId)
    try {
      await page.goto(`/binders/${binder.id}`)
      await expect(page.getByTestId('spread-prev-btn')).toBeDisabled()
    } finally {
      await cleanupBinder(binder.id)
    }
  })

  test('桌面：跨頁拖拉懸停邊緣自動翻頁並完成放置', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    // 3 頁卡冊 → Spread 0（封面 + Page 1）、Spread 1（Page 2 + Page 3）
    const { binder, slots } = await createMultiPageBinder(userId, { pageCount: 3 })
    const sourceSlot = slots.find((s) => s.pageNumber === 1 && s.slotIndex === 0)
    expect(sourceSlot).toBeDefined()
    try {
      await page.goto(`/binders/${binder.id}`)
      const spreadView = page.getByTestId('binder-spread-view')
      await expect(spreadView).toBeVisible()

      const source = spreadView.getByTestId(`slot-card-${sourceSlot!.id}`)
      await startDrag(page, source)

      // 移到容器右緣 zone（edgeWidth 40px，取距右邊 ~20px；hook 只看 X，Y 取容器中線）
      const container = page.getByTestId('spread-drag-container')
      const box = await container.boundingBox()
      expect(box).not.toBeNull()
      const edgeX = box!.x + box!.width - 20
      const midY = box!.y + box!.height / 2
      await page.mouse.move(edgeX, midY, { steps: 15 })
      // 補一發 -2px move（仍在 zone 內）確保 dragMove 觸發 zone 判定
      await page.mouse.move(edgeX - 2, midY)

      // 按住不動，等 600ms hold 計時翻頁至 Spread 1（Page 2 + Page 3）
      await expect(spreadView.getByText('第 2 頁')).toBeVisible({ timeout: 3000 })
      // 翻頁後原 source 節點已 unmount（DragOverlay 維持拖拉），不可再對 source 斷言

      // 重新量測目標（DOM 已重渲染）；移過去即離開右緣 zone，避免二次翻頁
      const target = page.locator('[data-page="2"][data-index="3"]')
      await expect(target).toBeVisible()
      await dropOn(page, target)

      // 最終以 DB 為準（optimistic update 可能回滾）
      await expect
        .poll(
          async () => {
            const slot = await prisma.binderSlot.findUnique({
              where: { id: sourceSlot!.id },
              select: { pageNumber: true, slotIndex: true },
            })
            return slot ? `${slot.pageNumber}-${slot.slotIndex}` : null
          },
          { timeout: 5000 },
        )
        .toBe('2-3')
    } finally {
      await cleanupBinder(binder.id)
    }
  })
})

test.describe('Binder Spread Layout - 行動裝置', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('行動裝置（viewport 模擬）：一次顯示一頁，初始為內封面', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
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

  // 行動版 swipe 翻頁已移除（避免與 dnd-kit 拖拉衝突），改用側邊按鈕或 Pagination 翻頁
})
