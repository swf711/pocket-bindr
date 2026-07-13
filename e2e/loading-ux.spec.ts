import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import { clearUserBindersByEmail } from './helpers/db'

const USER = getTestUser('loadingux')

test.describe('Loading UX — route skeleton + 頂部進度條', () => {
  test.beforeEach(async () => {
    await clearUserBindersByEmail(USER.email)
  })

  test('導航至卡冊列表期間顯示 BinderListSkeleton', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/cards')
    await expect(page.getByTestId('nav-binders')).toBeVisible()

    // 先確保 /binders 的 prefetch（loading.tsx 邊界 = skeleton 殼）已快取完成再點擊：
    // App Router 的 auto prefetch 只快取到 loading 邊界、非同步觸發，若 prefetch 未完成就 click，
    // Next 會停在舊頁等整包 RSC（被下方延遲）而不顯示 skeleton。
    // ⚠️ 只等「第一發 prefetch response」不夠——實測 hover 會觸發不只一發 prefetch，等到第一發就
    // 放行時第二發仍在飛，Next 仍拿不到已快取的邊界 → 停在舊頁、skeleton 不出現（舊版競態根因）。
    // 改以 networkidle 等所有 prefetch 完全落地。
    await page.getByTestId('nav-binders').hover()
    await page.waitForLoadState('networkidle')

    // 只延遲「實際導航」的 RSC，放行 prefetch。以 next-router-prefetch header 區分。
    await page.route('**/binders**', async (route) => {
      const isPrefetch = Boolean(route.request().headers()['next-router-prefetch'])
      if (!isPrefetch) await new Promise((r) => setTimeout(r, 2000))
      await route.continue()
    })

    try {
      await page.getByTestId('nav-binders').click()
      // loading.tsx 的 BinderListSkeleton 應於導航等待期間出現（邊界已快取，必定即時顯現）
      await expect(page.getByTestId('binder-list-skeleton')).toBeVisible()
    } finally {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    }
  })

  test('主導航 pending 時顯示頂部進度條', async ({ page }) => {
    await loginAs(page, USER)
    await page.goto('/binders')

    // /cards 無 loading.tsx，節流後舊頁停留，PendingLink 的 nav-progress 會持續顯示
    await page.route('**/cards**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.continue()
    })

    try {
      await page.getByTestId('nav-cards').click()
      await expect(page.getByTestId('nav-progress')).toBeVisible()
    } finally {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    }
  })
})
