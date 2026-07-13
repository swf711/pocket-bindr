import { test, expect, type Page } from './helpers/test'

// 此 spec 不需 auth（卡牌搜尋頁為公開），不需 DB cleanup

async function openFirstCardDrawer(page: Page) {
  // 搜尋頁卡片現為 <Link>（觸發 Intercepting Route 攔截），非 <button>；
  // 以 data-testid 選取與其他 spec 一致，不依賴底層元素標籤。
  const firstCard = page.getByTestId('card-item').first()
  await firstCard.click()
  await expect(page.getByTestId('card-detail-drawer')).toBeVisible({ timeout: 8000 })
}

test.describe('卡牌 3D 傾斜效果（桌面 Drawer）', () => {
  test.beforeEach(async ({ page }) => {
    // 桌面 viewport（預設），確保不觸發行動裝置邏輯
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/cards?game=PTCG&language=EN')
    await page.getByTestId('card-grid').waitFor({ timeout: 15000 })
  })

  test('桌面 drawer 開啟後 tilt container 存在', async ({ page }) => {
    await openFirstCardDrawer(page)
    await expect(page.locator('[data-tilt-container]')).toBeVisible()
  })

  test('tilt container 內有 card-detail-image', async ({ page }) => {
    await openFirstCardDrawer(page)
    const img = page.locator('[data-tilt-container]').locator('[data-testid="card-detail-image"]')
    await expect(img).toBeVisible()
  })

  test('hover 後 transformer div 有 perspective transform style', async ({ page }) => {
    await openFirstCardDrawer(page)
    const container = page.locator('[data-tilt-container]')
    await container.hover()

    // 稍等讓 rAF / state update 生效
    await page.waitForTimeout(100)

    const transformValue = await container.evaluate((el) => {
      const transformer = el.firstElementChild as HTMLElement | null
      return transformer?.style.transform ?? ''
    })
    expect(transformValue).toContain('perspective(800px)')
  })

  test('mousemove 後 transform 包含 rotateX', async ({ page }) => {
    await openFirstCardDrawer(page)
    const container = page.locator('[data-tilt-container]')
    const box = await container.boundingBox()
    if (!box) throw new Error('tilt container bounding box not found')

    // Move mouse to upper-right corner of card to get non-zero angles
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2)
    await page.waitForTimeout(100)

    const transformValue = await container.evaluate((el) => {
      const transformer = el.firstElementChild as HTMLElement | null
      return transformer?.style.transform ?? ''
    })
    expect(transformValue).toContain('rotateX(')
    expect(transformValue).toContain('rotateY(')
  })

  test('card-detail-image 保有 alt 屬性（無障礙回歸）', async ({ page }) => {
    await openFirstCardDrawer(page)
    const img = page.locator('[data-testid="card-detail-image"]')
    const alt = await img.getAttribute('alt')
    expect(alt).toBeTruthy()
  })

  test('行動裝置 viewport 也渲染 tilt container（支援觸控傾斜）', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/cards?game=PTCG&language=EN')
    await page.getByTestId('card-grid').waitFor({ timeout: 15000 })

    const firstCard = page.getByTestId('card-item').first()
    await firstCard.click()
    await expect(page.getByTestId('card-detail-drawer')).toBeVisible({ timeout: 8000 })

    await expect(page.locator('[data-tilt-container]')).toBeVisible()
  })
})
