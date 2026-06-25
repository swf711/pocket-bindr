import { test, expect } from '@playwright/test'
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
    // Next 會停在舊頁等整包 RSC（被下方延遲）而不顯示 skeleton → 競態 flaky。
    // hover 觸發 prefetch 並等其 response 完成；若 goto 期間已 prefetch 過則不再發、catch 放行。
    const prefetchDone = page
      .waitForResponse(
        (res) =>
          res.url().includes('/binders') &&
          Boolean(res.request().headers()['next-router-prefetch']),
        { timeout: 10_000 },
      )
      .catch(() => null)
    await page.getByTestId('nav-binders').hover()
    await prefetchDone

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
