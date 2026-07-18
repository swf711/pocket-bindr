import { test, expect } from './helpers/test'
import { getTestUser } from './helpers/auth'
import {
  clearUserBindersByEmail,
  createMultiPageBinder,
  getUserIdByEmail,
  createPasswordUser,
  cleanupBinder,
} from './helpers/db'
import { prisma } from '../src/lib/prisma'

const USER = getTestUser('bpublickbd')

// 公開分享頁（/b/[token]）為未登入可瀏覽的唯讀頁，方向鍵翻頁行為比照 /binders/[id]。
test.describe('公開分享頁方向鍵翻頁', () => {
  test.beforeEach(async () => {
    // 帳號需存在才能建 binder（公開頁本身不需登入，但擁有者帳號要有）。
    await createPasswordUser(USER.email, USER.username, USER.password)
    await clearUserBindersByEmail(USER.email)
  })

  test('未登入訪客 ArrowRight/ArrowLeft 於桌面翻頁；查看卡牌 Drawer 開啟時不誤翻', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 4 })
    const token = 'e2epublickbdtoken00000000000001'
    await prisma.binder.update({ where: { id: binder.id }, data: { shareToken: token } })

    try {
      // 全程不登入，直接以訪客身份訪問公開頁。
      await page.goto(`/b/${token}`)
      const spreadView = page.getByTestId('binder-public-spread-view')
      // 桌面/行動版翻頁標籤同時存在於 DOM（僅 CSS hidden 切換可見度，見 binder-public-view.tsx），
      // 需 filter 可見元素避免 strict-mode 命中 2 個
      const pageLabel = spreadView.getByText(/^\d+ \/ \d+$/).filter({ visible: true })
      await expect(pageLabel).toHaveText('1 / 3')

      await page.keyboard.press('ArrowRight')
      await expect(pageLabel).toHaveText('2 / 3')

      await page.keyboard.press('ArrowLeft')
      await expect(pageLabel).toHaveText('1 / 3')

      // 點擊格位開啟查看卡牌 Drawer 後，方向鍵不應再翻卡冊頁（gate 掉 [role="dialog"]）。
      await spreadView.locator('img').first().click()
      await expect(page.getByTestId('card-detail-drawer')).toBeVisible()

      await page.keyboard.press('ArrowRight')
      await expect(pageLabel).toHaveText('1 / 3')
    } finally {
      await cleanupBinder(binder.id)
    }
  })
})

test.describe('公開分享頁行動版方向鍵翻頁', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test.beforeEach(async () => {
    await createPasswordUser(USER.email, USER.username, USER.password)
    await clearUserBindersByEmail(USER.email)
  })

  test('未登入訪客可由封面一路翻到最後一頁', async ({ page }) => {
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 4 })
    const token = 'e2epublickbdmobile000000000001'
    await prisma.binder.update({ where: { id: binder.id }, data: { shareToken: token } })

    try {
      await page.goto(`/b/${token}`)
      const mobileView = page.getByTestId('binder-public-mobile-view')
      const pageLabel = mobileView.getByText(/^\d+ \/ \d+$/)
      await expect(pageLabel).toHaveText('1 / 5')

      for (let index = 0; index < 4; index += 1) await page.keyboard.press('ArrowRight')
      await expect(pageLabel).toHaveText('5 / 5')

      await page.keyboard.press('ArrowRight')
      await expect(pageLabel).toHaveText('5 / 5')
    } finally {
      await cleanupBinder(binder.id)
    }
  })
})
