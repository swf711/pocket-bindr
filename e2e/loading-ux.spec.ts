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

    // 只延遲「實際導航」的 RSC，放行 prefetch（其快取 loading.tsx 邊界，
    // 否則 Next 會停在舊頁不顯示 skeleton）。以 next-router-prefetch header 區分。
    await page.route('**/binders**', async (route) => {
      const isPrefetch = Boolean(route.request().headers()['next-router-prefetch'])
      if (!isPrefetch) await new Promise((r) => setTimeout(r, 2000))
      await route.continue()
    })

    try {
      await page.getByTestId('nav-binders').click()
      // loading.tsx 的 BinderListSkeleton 應於導航等待期間出現
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
