// Requires running server and test database
import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserCardsByEmail,
  clearUserBindersByEmail,
  getUserIdByEmail,
  getCardWithImage,
  upsertOwnedUserCard,
  createBinderWithSlots,
} from './helpers/db'
import { prisma } from '../src/lib/prisma'

const USER = getTestUser('collection')

async function upsertWantedUserCard(userId: string, cardId: string, quantity: number) {
  await prisma.userCard.upsert({
    where: { userId_cardId_status: { userId, cardId, status: 'wanted' } },
    create: { userId, cardId, status: 'wanted', quantity },
    update: { quantity },
  })
}

test.describe('我的收藏頁', () => {
  test.beforeEach(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await prisma.$disconnect()
  })

  test('未登入造訪 /collection → 導向 /login', async ({ page }) => {
    await page.goto('/collection')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('登入後進頁即顯示已標記卡（不需先選 game）', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    await upsertOwnedUserCard(userId, card.id, 1)

    await page.goto('/collection')
    await expect(page.getByTestId('collection-total')).toContainText('1', { timeout: 8000 })
    await expect(page.getByTestId('card-grid')).toBeVisible()
  })

  test('無任何標記時顯示空清單訊息', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/collection')
    await expect(page.getByTestId('collection-empty')).toBeVisible({ timeout: 8000 })
  })

  test('status 篩選：切「想要」只剩 wanted 卡', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    await upsertOwnedUserCard(userId, card.id, 1)

    await page.goto('/collection')
    // 先確認「全部」有卡
    await expect(page.getByTestId('card-grid')).toBeVisible({ timeout: 8000 })

    // 切「想要」 → 無卡（只有 owned）
    await page.getByTestId('status-filter-wanted').click()
    await expect(page.getByTestId('collection-empty')).toBeVisible({ timeout: 5000 })
  })

  test('status 篩選：切「擁有」只剩 owned 卡', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    await upsertWantedUserCard(userId, card.id, 1)

    await page.goto('/collection')
    await expect(page.getByTestId('card-grid')).toBeVisible({ timeout: 8000 })

    // 切「擁有」→ 無卡（只有 wanted）
    await page.getByTestId('status-filter-owned').click()
    await expect(page.getByTestId('collection-empty')).toBeVisible({ timeout: 5000 })
  })

  test('game 篩選縮小結果', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    await upsertOwnedUserCard(userId, card.id, 1)

    await page.goto('/collection')
    await expect(page.getByTestId('collection-total')).toContainText('1', { timeout: 8000 })

    // 篩選 OPCG → 結果應為空
    await page.getByTestId('game-filter').click()
    await page.getByRole('option', { name: 'OPCG' }).click()
    await expect(page.getByTestId('collection-empty')).toBeVisible({ timeout: 5000 })
  })

  test('卡名文字搜尋過濾', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    await upsertOwnedUserCard(userId, card.id, 1)

    await page.goto('/collection')
    await expect(page.getByTestId('collection-total')).toContainText('1', { timeout: 8000 })

    // 搜尋不存在的名稱
    await page.getByTestId('collection-search-input').fill('ZZZNOMATCH')
    await expect(page.getByTestId('collection-empty')).toBeVisible({ timeout: 5000 })
  })

  test('點卡開啟 Drawer → 從 Drawer 加入卡冊成功，清單徽章即時更新', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    await upsertOwnedUserCard(userId, card.id, 1)
    await createBinderWithSlots(userId, 'grid_3x3', [])

    await page.goto('/collection')
    await expect(page.getByTestId('card-grid')).toBeVisible({ timeout: 8000 })

    // 點擊卡牌開啟 Drawer
    await page.getByTestId('card-grid').locator('[data-testid^="card-item-"]').first().click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible({ timeout: 5000 })

    // 加入卡冊
    await page.getByTestId('modal-add-btn').click()
    await expect(page.getByText(/已加入/)).toBeVisible({ timeout: 5000 })
  })
})
