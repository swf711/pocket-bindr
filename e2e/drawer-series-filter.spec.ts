import { test, expect } from './helpers/test'
import { prisma } from '../src/lib/prisma'
import { getTestUser, loginAs } from './helpers/auth'
import {
  getCardWithImage,
  createBinderWithSlots,
  clearUserBindersByEmail,
  clearBinderShareToken,
  getUserIdByEmail,
} from './helpers/db'

const USER = getTestUser('drawerseriesfilter')

test.describe('搜尋頁 Drawer 系列可點篩選', () => {
  test('/cards 攔截 modal 點系列 → modal 關閉且列表已篩選到該系列', async ({ page }) => {
    await page.goto('/cards?game=PTCG')
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    await page.getByTestId('card-item').first().click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    const seriesBtn = page.getByTestId('drawer-series-filter')
    await expect(seriesBtn).toBeVisible()
    const seriesText = (await seriesBtn.textContent())!.trim()

    await seriesBtn.click()

    // modal 隨導航自然關閉（router.push 離開攔截路由）
    await expect(page.getByTestId('card-detail-drawer')).not.toBeVisible()
    await expect(page).toHaveURL(/setId=/, { timeout: 10000 })
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
    // combobox 顯示套用的系列名稱（seriesText 內含 externalId，取子字串比對即可）
    await expect(page.getByTestId('set-combobox')).toContainText(seriesText.split(' ')[0])
  })
})

test.describe('獨立卡片頁系列可點篩選', () => {
  test('點系列名 → 導向 /cards 並套用該系列篩選', async ({ page }) => {
    const card = await getCardWithImage('PTCG', 'EN')
    await page.goto(`/cards/ptcg/en/${card.externalId}`)

    const seriesLink = page.getByTestId('standalone-series-filter')
    await expect(seriesLink).toBeVisible()
    await expect(seriesLink).toHaveAttribute('href', new RegExp(`/cards\\?game=PTCG&language=EN&setId=`))

    await seriesLink.click()
    await expect(page).toHaveURL(/\/cards\?game=PTCG&language=EN&setId=/)
    await page.getByTestId('card-grid').waitFor({ timeout: 10000 })
  })
})

test.describe('回歸：既有三處 Drawer 系列維持純文字（不可點）', () => {
  test.beforeEach(async () => {
    await clearUserBindersByEmail(USER.email)
  })

  test.afterAll(async () => {
    await clearUserBindersByEmail(USER.email)
  })

  test('/binders/[id] 查看卡牌 Drawer 系列不可點', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.getByTestId(`slot-card-${slots[0].id}`).hover()
    await view.getByTestId(`slot-view-btn-${slots[0].id}`).click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

    await expect(page.getByTestId('drawer-series-filter')).toHaveCount(0)
    await expect(page.getByText(card.name)).toBeVisible()
  })

  test('/b/[token] 公開分享頁 Drawer 系列不可點', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )
    const token = 'e2etesttokendrawerseries0000000001'
    await prisma.binder.update({ where: { id: binder.id }, data: { shareToken: token } })

    try {
      await page.goto(`/b/${token}`)
      await page.locator(`img[alt="${card.name}"]`).first().click()
      await expect(page.getByTestId('card-detail-drawer').filter({ visible: true })).toBeVisible()
      await expect(page.getByTestId('drawer-series-filter')).toHaveCount(0)
    } finally {
      await clearBinderShareToken(binder.id)
    }
  })
})
