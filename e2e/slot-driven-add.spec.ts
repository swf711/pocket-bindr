// Requires running server and test database
import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  createMultiPageBinder,
  getUserIdByEmail,
} from './helpers/db'
import { startDrag } from './helpers/drag'

const USER = getTestUser('slotdrivenadd')

test.describe('格位驅動加入卡片', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('空格位 hover 顯示加入操作，拖拉中不顯示', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })

    await page.goto(`/binders/${binder.id}`)
    await page.getByTestId('binder-spread-view').waitFor()

    const addBtn = page.getByTestId('empty-slot-add-1-1')
    await addBtn.hover()
    await expect(addBtn).toBeVisible()

    // 拖拉中，Plus icon 不顯示（isDragging=true 時條件渲染移除，整格仍可見）
    const filledSlot = page.locator('[data-testid^="slot-card-"]').first()
    await startDrag(page, filledSlot)
    await expect(addBtn.locator('svg')).toHaveCount(0)
    await page.mouse.up()
  })

  test('從空格位加入卡片（owned）', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })

    await page.goto(`/binders/${binder.id}`)
    await page.getByTestId('binder-spread-view').waitFor()

    await page.getByTestId('empty-slot-add-1-1').hover()
    await page.getByTestId('empty-slot-add-1-1').click()

    await expect(page.getByTestId('slot-card-picker-dialog')).toBeVisible()
    await page.getByTestId('game-btn-ptcg').click()
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()

    await page.getByTestId('picker-status-owned').click()
    await page.getByTestId('slot-card-picker-confirm').click()

    await expect(page.getByTestId('slot-card-picker-dialog')).toBeHidden()
    await expect(page.getByText(/已加入/)).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-page="1"][data-index="1"]')).toHaveCount(0)
  })

  test('從空格位加入卡片（wanted）顯示黑白圖片', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })

    await page.goto(`/binders/${binder.id}`)
    await page.getByTestId('binder-spread-view').waitFor()

    await page.getByTestId('empty-slot-add-1-1').click()
    await page.getByTestId('game-btn-ptcg').click()
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()

    await page.getByTestId('picker-status-wanted').click()
    await page.getByTestId('slot-card-picker-confirm').click()

    await expect(page.getByTestId('slot-card-picker-dialog')).toBeHidden()

    const newSlot = page.getByTestId('binder-spread-view').locator('img.grayscale')
    await expect(newSlot).toBeVisible({ timeout: 8000 })
  })

  test('已有卡片的格位不開啟加入卡片 Dialog', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })

    await page.goto(`/binders/${binder.id}`)
    const filledSlot = page.locator('[data-testid^="slot-card-"]').first()
    await filledSlot.click()
    await expect(page.getByTestId('slot-card-picker-dialog')).not.toBeVisible()
  })

  test('選卡 Dialog 內系列篩選下拉可用滑鼠滾輪滾動（巢狀 Popover-in-Dialog scroll-lock 迴歸測試）', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })

    await page.goto(`/binders/${binder.id}`)
    await page.getByTestId('binder-spread-view').waitFor()

    await page.getByTestId('empty-slot-add-1-1').click()
    await expect(page.getByTestId('slot-card-picker-dialog')).toBeVisible()
    await page.getByTestId('game-btn-ptcg').click()

    await page.getByTestId('set-combobox').click()
    const commandList = page.locator('[data-slot="command-list"]')
    await expect(commandList).toBeVisible({ timeout: 5000 })

    // 系列清單（groups）由 /api/sets 非同步載入、無 loading state：popover 剛開啟時清單可能只有
    // 靜態的「全部系列」一項，scrollHeight === clientHeight（不可捲）。wheel 事件若在資料到位前打出，
    // 之後的 expect.poll 只會重複讀 scrollTop（不會重打 wheel），必然逾時。故先等清單真的可捲動
    // （代表 /api/sets 已回來、足夠多的 CommandItem 撐出高度），再發送 wheel。
    await expect
      .poll(() => commandList.evaluate(el => el.scrollHeight > el.clientHeight), { timeout: 5000 })
      .toBe(true)

    const scrollBefore = await commandList.evaluate(el => el.scrollTop)
    const box = await commandList.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.wheel(0, 400)
    }
    await expect
      .poll(() => commandList.evaluate(el => el.scrollTop), { timeout: 5000 })
      .toBeGreaterThan(scrollBefore)
  })
})
