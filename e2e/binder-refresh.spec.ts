import { test, expect } from './helpers/test'
import { prisma } from '../src/lib/prisma'
import { getTestUser, loginAs } from './helpers/auth'
import { getUserIdByEmail, createMultiPageBinder, cleanupBinder } from './helpers/db'

const USER = getTestUser('binderrefresh')

test.describe('卡冊檢視重整鍵', () => {
  test('另一分頁加卡後點重整鍵，新卡出現且仍停在原本翻頁位置', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    // 3 頁：Spread 0（封面+Page1）、Spread 1（Page2+Page3）
    const { binder, slots } = await createMultiPageBinder(userId, { pageCount: 3 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const view = page.getByTestId('binder-spread-view')
      // Spread 0 只顯示 Page1 的格位（1 格）
      await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(1)

      // 翻到 Spread 1（Page2+Page3），驗證重整後仍停在此，而非被重設回封面
      await view.getByTestId('spread-next-btn').click()
      await expect(view.locator('.tabular-nums')).toHaveText('2 / 2')
      await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(2)

      // 模擬「另一分頁加入卡片」：直接寫入一個新格位（Page3 slotIndex 1，當前 Spread 1 可見範圍內）
      const card = await prisma.card.findFirstOrThrow({ where: { imageSmall: { not: '' } } })
      await prisma.userCard.upsert({
        where: { userId_cardId_status: { userId, cardId: card.id, status: 'owned' } },
        create: { userId, cardId: card.id, status: 'owned', quantity: 1 },
        update: { quantity: { increment: 1 } },
      })
      const newSlot = await prisma.binderSlot.create({
        data: { binderId: binder.id, cardId: card.id, status: 'owned', pageNumber: 3, slotIndex: 1 },
      })

      await view.getByTestId('binder-refresh-btn').click()

      // 新格位出現，且仍停在 Spread 1（未被重設回封面）
      await expect(view.getByTestId(`slot-card-${newSlot.id}`)).toBeVisible({ timeout: 8000 })
      await expect(view.locator('.tabular-nums')).toHaveText('2 / 2')
      await expect(view.locator('[data-testid^="slot-card-"]')).toHaveCount(3)
    } finally {
      await cleanupBinder(binder.id)
      void slots
    }
  })

  test('另一分頁新增空白頁後重整，頁數增加', async ({ page }) => {
    await loginAs(page, USER)
    const userId = await getUserIdByEmail(USER.email)
    const { binder } = await createMultiPageBinder(userId, { pageCount: 1 })
    try {
      await page.goto(`/binders/${binder.id}`)
      const view = page.getByTestId('binder-spread-view')
      await expect(view.locator('.tabular-nums')).toHaveText('1 / 1')
      // 只有 1 頁時 spreadIndex=0 即最後一個 spread，「下一頁」位置改顯示「新增內頁」按鈕（非 chevron）
      await expect(view.getByTestId('spread-add-page-btn')).toBeVisible()
      await expect(view.getByTestId('spread-next-btn')).toHaveCount(0)

      // 模擬「另一分頁新增內頁」：直接更新 settings.totalPages（GET route 之前不回此值，
      // 是本次擴充的重點——不靠 slots 反推才能抓到全新的空白頁）
      await prisma.binder.update({ where: { id: binder.id }, data: { settings: { totalPages: 2 } } })

      await view.getByTestId('binder-refresh-btn').click()

      await expect(view.locator('.tabular-nums')).toHaveText('1 / 2', { timeout: 8000 })
      // 頁數增加後不再是最後一個 spread，chevron 型「下一頁」按鈕出現且可點
      await expect(view.getByTestId('spread-next-btn')).toBeEnabled()
    } finally {
      await cleanupBinder(binder.id)
    }
  })
})
