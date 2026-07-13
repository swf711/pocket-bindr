import { test, expect } from './helpers/test'
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
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('分享測試冊')
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()

    // 點擊 ⋮ 按鈕
    await page.getByTestId('binder-card').filter({ visible: true }).first().hover()
    await page.getByTestId('binder-more-btn').filter({ visible: true }).click()

    // DropdownMenu 展開後應看到編輯/分享/刪除
    await expect(page.getByTestId('edit-binder-btn').filter({ visible: true })).toBeVisible()
    await expect(page.getByTestId('share-binder-btn').filter({ visible: true })).toBeVisible()
    await expect(page.getByTestId('delete-binder-btn').filter({ visible: true })).toBeVisible()
  })

  test('列表頁：啟用分享 → 顯示連結 → 可複製', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('分享測試冊')
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()

    // 開啟分享 Dialog
    await page.getByTestId('binder-card').filter({ visible: true }).first().hover()
    await page.getByTestId('binder-more-btn').filter({ visible: true }).click()
    await page.getByTestId('share-binder-btn').filter({ visible: true }).click()

    // Dialog 打開，顯示啟用按鈕
    await expect(page.getByTestId('enable-share-btn').filter({ visible: true })).toBeVisible()

    // 啟用分享
    await page.getByTestId('enable-share-btn').filter({ visible: true }).click()

    // 切換到已分享狀態 — 顯示連結 input 和複製按鈕
    await expect(page.getByTestId('share-url-input').filter({ visible: true })).toBeVisible()
    await expect(page.getByTestId('copy-share-url-btn').filter({ visible: true })).toBeVisible()
    await expect(page.getByTestId('revoke-share-btn').filter({ visible: true })).toBeVisible()

    // Input 中的 URL 含 /b/
    const shareUrl = await page.getByTestId('share-url-input').filter({ visible: true }).inputValue()
    expect(shareUrl).toContain('/b/')
    expect(shareUrl).toHaveLength(shareUrl.length)
  })

  test('撤銷分享 → 舊連結 404', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/binders')
    await page.getByText('建立第一本卡冊').filter({ visible: true }).click()
    await page.getByTestId('binder-name-input').filter({ visible: true }).fill('撤銷測試冊')
    await page.getByTestId('create-binder-submit').filter({ visible: true }).click()
    await expect(page.getByTestId('binder-card').filter({ visible: true }).first()).toBeVisible()

    // 啟用分享
    await page.getByTestId('binder-card').filter({ visible: true }).first().hover()
    await page.getByTestId('binder-more-btn').filter({ visible: true }).click()
    await page.getByTestId('share-binder-btn').filter({ visible: true }).click()
    await page.getByTestId('enable-share-btn').filter({ visible: true }).click()

    const shareUrl = await page.getByTestId('share-url-input').filter({ visible: true }).inputValue()

    // 撤銷分享
    await page.getByTestId('revoke-share-btn').filter({ visible: true }).click()
    await expect(page.getByTestId('enable-share-btn').filter({ visible: true })).toBeVisible()

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
    await page.getByTestId('binder-settings-btn').filter({ visible: true }).first().click()

    // 找到 Drawer 內的啟用分享按鈕
    await expect(page.getByTestId('drawer-enable-share-btn').filter({ visible: true })).toBeVisible()
    await page.getByTestId('drawer-enable-share-btn').filter({ visible: true }).click()

    // 應顯示連結 input
    await expect(page.getByTestId('drawer-share-url-input').filter({ visible: true })).toBeVisible()

    const shareUrl = await page.getByTestId('drawer-share-url-input').filter({ visible: true }).inputValue()
    expect(shareUrl).toContain('/b/')

    // 撤銷
    await page.getByTestId('drawer-revoke-share-btn').filter({ visible: true }).click()
    await expect(page.getByTestId('drawer-enable-share-btn').filter({ visible: true })).toBeVisible()

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

    // 顯示 owner banner（spread + mobile 兩 view 各渲染一份，取首個可見者）
    await expect(page.getByTestId('public-owner-banner').filter({ visible: true }).first()).toBeVisible()

    // 無 Settings 觸發按鈕（公開唯讀頁不含 binder-settings-btn）
    await expect(page.getByTestId('binder-settings-btn').filter({ visible: true })).toHaveCount(0)

    // 清理
    await clearBinderShareToken(binder.id)
  })

  test('公開頁：未登入訪客顯示註冊 CTA，連結指向 /register', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )

    const token = 'e2etesttoken00000000000000000004'
    await prisma.binder.update({ where: { id: binder.id }, data: { shareToken: token } })

    await page.goto(`/b/${token}`)

    // 未登入訪客看到頁尾 CTA
    await expect(page.getByTestId('public-share-cta').filter({ visible: true })).toBeVisible()
    const register = page.getByTestId('public-share-cta-register').filter({ visible: true })
    await expect(register).toBeVisible()
    await expect(register).toHaveAttribute('href', /\/register/)

    await clearBinderShareToken(binder.id)
  })

  test('公開頁：未登入訪客點格位 → 卡牌詳情顯示登入引導', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )

    const token = 'e2etesttoken00000000000000000002'
    await prisma.binder.update({ where: { id: binder.id }, data: { shareToken: token } })

    await page.goto(`/b/${token}`)

    // 點擊有卡的格位（取首個可見的卡圖）
    await page.locator(`img[alt="${card.name}"]`).first().click()

    // CardDetailDrawer 開啟；未登入訪客的加入卡冊區塊顯示登入引導
    await expect(page.getByTestId('card-detail-drawer').filter({ visible: true })).toBeVisible()
    await expect(page.getByText('請先登入以加入卡冊').filter({ visible: true })).toBeVisible({ timeout: 5000 })
    await page.getByTestId('modal-add-btn').filter({ visible: true }).click()
    await expect(page.getByTestId('login-modal').filter({ visible: true })).toBeVisible({ timeout: 5000 })

    await clearBinderShareToken(binder.id)
  })

  test('公開頁：登入訪客可把卡加入自己的卡冊', async ({ page }) => {
    // 卡冊擁有者
    const ownerId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder } = await createBinderWithSlots(
      ownerId,
      'grid_3x3',
      [{ cardId: card.id, status: 'owned', pageNumber: 1, slotIndex: 0 }],
    )
    const token = 'e2etesttoken00000000000000000003'
    await prisma.binder.update({ where: { id: binder.id }, data: { shareToken: token } })

    // 訪客（另一帳號）登入並備妥自己的卡冊
    const VISITOR = getTestUser('bindersharevisitor')
    await clearUserBindersByEmail(VISITOR.email)
    await loginAs(page, VISITOR)
    const visitorRes = await page.request.post('/api/binders', {
      data: { name: 'Visitor Binder', gridType: 'grid_3x3' },
    })
    expect(visitorRes.status()).toBe(201)

    await page.goto(`/b/${token}`)

    // 已登入訪客不顯示註冊 CTA
    await expect(page.getByTestId('public-share-cta')).toHaveCount(0)

    await page.locator(`img[alt="${card.name}"]`).first().click()
    await expect(page.getByTestId('card-detail-drawer').filter({ visible: true })).toBeVisible()

    // 下拉為訪客自己的卡冊；加入成功
    await expect(page.getByTestId('modal-binder-select').filter({ visible: true })).toContainText('Visitor Binder')
    await page.getByTestId('modal-add-btn').filter({ visible: true }).click()
    await expect(page.getByText(/已加入/).filter({ visible: true })).toBeVisible({ timeout: 5000 })

    await clearBinderShareToken(binder.id)
    await clearUserBindersByEmail(VISITOR.email)
  })

  test('無效 token → 404 頁面', async ({ page }) => {
    const res = await page.goto('/b/invalidtoken00000000000000000000')
    expect(res?.status()).toBe(404)
  })
})
