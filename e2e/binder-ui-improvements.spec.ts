// Requires running server and test database
import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  createBinderWithSlots,
  getCardWithImage,
  getUserIdByEmail,
} from './helpers/db'

const USER = getTestUser('binderuiimprove')

test.describe('卡牌搜尋頁 UI 改動', () => {
  test('GameSelector 未選擇時顯示 Coming Soon 按鈕，不可點擊', async ({ page }) => {
    await page.goto('/cards')
    await expect(page.getByTestId('game-btn-coming-soon')).toBeVisible()
    await expect(page.getByTestId('game-btn-coming-soon')).toBeDisabled()
  })

  test('系列篩選 ComboBox 在關鍵字搜尋輸入框之前', async ({ page }) => {
    await page.goto('/cards')
    await page.getByTestId('game-btn-ptcg').click()
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })

    const seriesCombobox = page.getByRole('combobox').first()
    const searchInput = page.getByTestId('search-input')
    await expect(seriesCombobox).toBeVisible()
    await expect(searchInput).toBeVisible()

    const seriesBox = await seriesCombobox.boundingBox()
    const searchBox = await searchInput.boundingBox()
    expect(seriesBox).not.toBeNull()
    expect(searchBox).not.toBeNull()
    expect(seriesBox!.x).toBeLessThanOrEqual(searchBox!.x)
  })
})

test.describe('卡冊內頁 UI 改動', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test('卡冊內頁查看按鈕開啟 CardDetailDrawer', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [
      { cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 },
    ])

    await page.goto(`/binders/${binder.id}`)
    await page.getByTestId('binder-spread-view').waitFor()

    const slot = page.locator('[data-testid^="slot-card-"]').first()
    await slot.hover()
    await slot.locator('[data-testid^="slot-view-btn-"]').click()

    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()
    await expect(page.getByText(card.name)).toBeVisible()
    await expect(page.getByTestId('modal-binder-select')).toHaveCount(0)
    await expect(page.getByTestId('modal-add-btn')).toHaveCount(0)
  })

  test('封面面板搜尋卡冊內卡牌並跳頁＋highlight', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const fillerCard = await getCardWithImage('PTCG')
    const targetCard = await getCardWithImage('OPCG')
    const { binder } = await createBinderWithSlots(userId, 'grid_3x3', [
      { cardId: fillerCard.id, status: 'owned', pageNumber: 1, slotIndex: 0 },
      { cardId: targetCard.id, status: 'owned', pageNumber: 3, slotIndex: 0 },
    ], { totalPages: 3 })

    await page.goto(`/binders/${binder.id}`)
    await page.getByTestId('binder-spread-view').waitFor()
    await expect(page.getByText('1 / 2')).toBeVisible()

    // 搜尋在封面面板（BinderCoverPanel），不在 settings drawer
    // binder-spread-view 和 binder-mobile-view 各有一個 cover-slot-search，需縮限範圍
    const spreadView = page.getByTestId('binder-spread-view')
    await spreadView.getByTestId('cover-slot-search').fill(targetCard.name)
    await expect(spreadView.getByTestId('cover-slot-search-results')).toBeVisible()
    await spreadView.getByTestId('cover-slot-search-results').getByText(targetCard.name).click()

    // 點擊後 query 清空，搜尋結果隱藏
    await expect(spreadView.getByTestId('cover-slot-search-results')).toHaveCount(0)
    // 翻頁後 spread counter 更新為 2/2（binder-spread-view 範圍內避免 strict mode 衝突）
    await expect(spreadView.getByText('2 / 2')).toBeVisible()

    const targetSlot = page.locator('[data-testid^="slot-card-"]').filter({
      has: page.locator(`img[alt="${targetCard.name}"]`),
    })
    await expect(targetSlot.first()).toHaveClass(/animate-pulse/)
  })
})
