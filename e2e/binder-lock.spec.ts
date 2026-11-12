import { test, expect } from './helpers/test'
import { prisma } from '../src/lib/prisma'
import { getTestUser, loginAs } from './helpers/auth'
import { getUserIdByEmail, createBinderWithSlots, cleanupBinder, getTwoCardIds } from './helpers/db'
import { dragSlotTo } from './helpers/drag'

const USER = getTestUser('binderlock')

test.describe('卡冊鎖定（唯讀模式）', () => {
  test.describe('桌面雙頁', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('鎖定後格位無法拖曳、無操作按鈕；點卡開詳情；重整保留；解鎖後可再拖曳', async ({ page }) => {
      await loginAs(page, USER)
      const userId = await getUserIdByEmail(USER.email)
      const [cardA, cardB] = await getTwoCardIds()
      const { binder, slots } = await createBinderWithSlots(userId, 'grid_3x3', [
        { cardId: cardA, status: 'owned', pageNumber: 1, slotIndex: 0 },
        { cardId: cardB, status: 'owned', pageNumber: 1, slotIndex: 4 },
      ])
      try {
        await page.goto(`/binders/${binder.id}`)
        const spread = page.getByTestId('binder-spread-view')
        const source = spread.getByTestId(`slot-card-${slots[0].id}`)
        const target = spread.getByTestId(`slot-card-${slots[1].id}`)
        await expect(source).toBeVisible()

        const lockBtn = spread.getByTestId('binder-lock-btn')
        await expect(lockBtn).toHaveAttribute('aria-pressed', 'false')
        await lockBtn.click()
        await expect(lockBtn).toHaveAttribute('aria-pressed', 'true')
        await expect(source).toHaveAttribute('data-locked', 'true')

        // Try to drag: the source must never enter the dragging state.
        const box = (await source.boundingBox())!
        const tBox = (await target.boundingBox())!
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + box.width / 2 + 12, box.y + box.height / 2, { steps: 3 })
        await expect(source).not.toHaveClass(/opacity-40/)
        await page.mouse.move(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2, { steps: 10 })
        await page.mouse.up()

        const positions = await prisma.binderSlot.findMany({
          where: { id: { in: [slots[0].id, slots[1].id] } },
          select: { id: true, slotIndex: true },
        })
        expect(Object.fromEntries(positions.map((p) => [p.id, p.slotIndex]))).toEqual({
          [slots[0].id]: 0,
          [slots[1].id]: 4,
        })

        // No slot actions while locked (hover would normally reveal them).
        await source.hover()
        await expect(spread.locator(`[data-testid="slot-more-btn-${slots[0].id}"]`)).toHaveCount(0)
        await expect(spread.locator('[data-testid^="empty-slot-remove-"]')).toHaveCount(0)

        // Empty slots do not open the card picker.
        await spread.locator('[data-page="1"][data-index="5"]').click()
        await expect(page.getByTestId('slot-card-picker-dialog')).toHaveCount(0)

        // Tapping a card opens its detail drawer.
        await source.click()
        await expect(page.getByTestId('card-detail-drawer')).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(page.getByTestId('card-detail-drawer')).toHaveCount(0)

        // Lock survives a reload (per-device storage).
        await page.reload()
        const lockAfterReload = page.getByTestId('binder-spread-view').getByTestId('binder-lock-btn')
        await expect(lockAfterReload).toHaveAttribute('aria-pressed', 'true')

        // Unlock → dragging works again.
        await lockAfterReload.click()
        await expect(lockAfterReload).toHaveAttribute('aria-pressed', 'false')
        const spread2 = page.getByTestId('binder-spread-view')
        await dragSlotTo(
          page,
          spread2.getByTestId(`slot-card-${slots[0].id}`),
          spread2.getByTestId(`slot-card-${slots[1].id}`),
        )
        await expect
          .poll(async () => {
            const a = await prisma.binderSlot.findUniqueOrThrow({ where: { id: slots[0].id } })
            const b = await prisma.binderSlot.findUniqueOrThrow({ where: { id: slots[1].id } })
            return [a.slotIndex, b.slotIndex]
          })
          .toEqual([4, 0])
      } finally {
        await cleanupBinder(binder.id)
      }
    })
  })

  test.describe('行動裝置', () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test('header 四顆按鈕不溢出畫面，鎖定鈕可切換', async ({ page }) => {
      await loginAs(page, USER)
      const userId = await getUserIdByEmail(USER.email)
      const [cardA] = await getTwoCardIds()
      const { binder } = await createBinderWithSlots(
        userId,
        'grid_3x3',
        [{ cardId: cardA, status: 'owned', pageNumber: 1, slotIndex: 0 }],
        { name: 'A Very Long Binder Name That Must Truncate In The Header' },
      )
      try {
        await page.goto(`/binders/${binder.id}`)
        const view = page.getByTestId('binder-mobile-view')
        const lockBtn = view.getByTestId('binder-lock-btn')
        const settingsBtn = view.getByTestId('binder-settings-btn')
        await expect(lockBtn).toBeVisible()
        await expect(settingsBtn).toBeVisible()

        const settingsBox = (await settingsBtn.boundingBox())!
        expect(settingsBox.x + settingsBox.width).toBeLessThanOrEqual(375)
        const lockBox = (await lockBtn.boundingBox())!
        expect(lockBox.x).toBeGreaterThanOrEqual(0)

        await lockBtn.click()
        await expect(lockBtn).toHaveAttribute('aria-pressed', 'true')

        // Back button is icon-only on mobile and uses the same arrow icon as desktop.
        const backBtn = view.getByTestId('back-to-binders-mobile')
        await expect(backBtn).toBeVisible()
        await expect(backBtn).toHaveAttribute('aria-label', /.+/)
        await expect(backBtn).toHaveText('')
        await expect(backBtn.locator('svg.lucide-arrow-left')).toHaveCount(1)
        await backBtn.click()
        await expect(page).toHaveURL(/\/binders$/)
      } finally {
        await cleanupBinder(binder.id)
      }
    })
  })
})
