import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearBinderShareToken,
  getUserIdByEmail,
  createBinderWithSlots,
  getCardWithImage,
} from './helpers/db'
import { prisma } from '../src/lib/prisma'

const USER = getTestUser('bindershare')

test.describe('卡冊公開分享', () => {
  test.beforeEach(async () => {
    await clearUserBindersByEmail(USER.email)
  })

  test('列表頁：⋮ 按鈕開啟 DropdownMenu 含分享選項', async ({ page }) => {
    await loginAs(page, USER)
    // 建立一本卡冊
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-name-input').fill('分享測試冊')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()

    // 點擊 ⋮ 按鈕
    await page.getByTestId('binder-more-btn').click()

    // DropdownMenu 展開後應看到編輯/分享/刪除
    await expect(page.getByTestId('edit-binder-btn')).toBeVisible()
    await expect(page.getByTestId('share-binder-btn')).toBeVisible()
    await expect(page.getByTestId('delete-binder-btn')).toBeVisible()
  })

  test('列表頁：啟用分享 → 顯示連結 → 可複製', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-name-input').fill('分享測試冊')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()

    // 開啟分享 Dialog
    await page.getByTestId('binder-more-btn').click()
    await page.getByTestId('share-binder-btn').click()

    // Dialog 打開，顯示啟用按鈕
    await expect(page.getByTestId('enable-share-btn')).toBeVisible()

    // 啟用分享
    await page.getByTestId('enable-share-btn').click()

    // 切換到已分享狀態 — 顯示連結 input 和複製按鈕
    await expect(page.getByTestId('share-url-input')).toBeVisible()
    await expect(page.getByTestId('copy-share-url-btn')).toBeVisible()
    await expect(page.getByTestId('revoke-share-btn')).toBeVisible()

    // Input 中的 URL 含 /b/
    const shareUrl = await page.getByTestId('share-url-input').inputValue()
    expect(shareUrl).toContain('/b/')
    expect(shareUrl).toHaveLength(shareUrl.length)
  })

  test('撤銷分享 → 舊連結 404', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').click()
    await page.getByTestId('binder-name-input').fill('撤銷測試冊')
    await page.getByTestId('create-binder-submit').click()
    await expect(page.getByTestId('binder-card')).toBeVisible()

    // 啟用分享
    await page.getByTestId('binder-more-btn').click()
    await page.getByTestId('share-binder-btn').click()
    await page.getByTestId('enable-share-btn').click()

    const shareUrl = await page.getByTestId('share-url-input').inputValue()

    // 撤銷分享
    await page.getByTestId('revoke-share-btn').click()
    await expect(page.getByTestId('enable-share-btn')).toBeVisible()

    // 舊連結應回傳 404
    const res = await page.request.get(shareUrl)
    expect(res.status()).toBe(404)
  })

  test('Settings Drawer：啟用分享 → 顯示連結 → 撤銷', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )

    await loginAs(page, USER)
    await page.goto(`/binders/${binder.id}`)

    // 開啟 Settings Drawer
    await page.getByTestId('open-settings-drawer').click()

    // 找到 Drawer 內的啟用分享按鈕
    await expect(page.getByTestId('drawer-enable-share-btn')).toBeVisible()
    await page.getByTestId('drawer-enable-share-btn').click()

    // 應顯示連結 input
    await expect(page.getByTestId('drawer-share-url-input')).toBeVisible()

    const shareUrl = await page.getByTestId('drawer-share-url-input').inputValue()
    expect(shareUrl).toContain('/b/')

    // 撤銷
    await page.getByTestId('drawer-revoke-share-btn').click()
    await expect(page.getByTestId('drawer-enable-share-btn')).toBeVisible()

    await clearBinderShareToken(binder.id)
  })

  test('公開頁：未登入可瀏覽，顯示 ownerName banner，無操作按鈕', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )

    // 直接 DB 設定 shareToken
    const token = 'e2etesttoken00000000000000000001'
    await prisma.binder.update({ where: { id: binder.id }, data: { shareToken: token } })

    // 無痕模式下訪問公開頁
    await page.goto(`/b/${token}`)

    // 顯示 owner banner
    await expect(page.getByTestId('public-owner-banner')).toBeVisible()

    // 無 Settings 觸發按鈕（open-settings-drawer）
    await expect(page.getByTestId('open-settings-drawer')).not.toBeVisible()

    // 清理
    await clearBinderShareToken(binder.id)
  })

  test('無效 token → 404 頁面', async ({ page }) => {
    const res = await page.goto('/b/invalidtoken00000000000000000000')
    expect(res?.status()).toBe(404)
  })
})
