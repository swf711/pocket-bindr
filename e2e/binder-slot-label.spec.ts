// Requires running server and test database
import { test, expect } from './helpers/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  clearUserBindersByEmail,
  clearUserCardsByEmail,
  createBinderWithSlots,
  getCardWithImage,
  getSlotLabels,
  getSlotPositionById,
  getUserIdByEmail,
  setBinderShareToken,
} from './helpers/db'

const USER = getTestUser('binderslotlabel')

/**
 * 開啟某格位的 ⋯ 選單並點「編輯標籤」。
 * ⚠️ 預設 viewport 1280×720 落在 compact 側，故一律走選單而非 inline 按鈕
 * （選單 portal 至 body，需用 page 而非 view 取得）。
 */
async function openLabelDialog(
  page: import('@playwright/test').Page,
  view: import('@playwright/test').Locator,
  slotId: string,
) {
  await view.getByTestId(`slot-card-${slotId}`).hover()
  await view.getByTestId(`slot-more-btn-${slotId}`).click()
  await page.getByTestId(`slot-label-menu-${slotId}`).click()
  await expect(page.getByTestId('slot-label-dialog')).toBeVisible()
}

/** 在 chip 輸入框逐一輸入標籤，每個以 Enter 成為一顆 chip。 */
async function addLabels(page: import('@playwright/test').Page, labels: string[]) {
  const input = page.getByTestId('slot-label-input')
  for (const label of labels) {
    await input.fill(label)
    await input.press('Enter')
  }
}

test.describe('卡冊格位標籤', () => {
  test.beforeEach(async ({ page }) => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
    await loginAs(page, USER)
  })

  test.afterAll(async () => {
    await clearUserCardsByEmail(USER.email)
    await clearUserBindersByEmail(USER.email)
  })

  async function setupBinder() {
    const userId = await getUserIdByEmail(USER.email)
    const card = await getCardWithImage('PTCG', 'EN')
    const { binder, slots } = await createBinderWithSlots(
      userId,
      'grid_3x3',
      [0, 1].map((slotIndex) => ({
        cardId: card.id,
        status: 'owned' as const,
        pageNumber: 1,
        slotIndex,
      })),
      { totalPages: 1 },
    )
    return { binder, slots }
  }

  test('從 ⋯ 選單設定標籤，格位底部顯示該文字且寫入 DB', async ({ page }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await openLabelDialog(page, view, slotId)
    await addLabels(page, ['No.025'])
    await page.getByTestId('slot-label-submit').click()

    await expect(view.getByTestId(`slot-label-${slotId}`)).toHaveText('No.025')
    await expect.poll(() => getSlotLabels(slotId)).toEqual(['No.025'])
  })

  test('可同時掛多個標籤，每個各成一顆 badge', async ({ page }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await openLabelDialog(page, view, slotId)
    await addLabels(page, ['No.025', 'SR', '待換'])
    await page.getByTestId('slot-label-submit').click()

    await expect(view.getByTestId(`slot-label-item-${slotId}-0`)).toHaveText('No.025')
    await expect(view.getByTestId(`slot-label-item-${slotId}-1`)).toHaveText('SR')
    await expect(view.getByTestId(`slot-label-item-${slotId}-2`)).toHaveText('待換')
    await expect.poll(() => getSlotLabels(slotId)).toEqual(['No.025', 'SR', '待換'])
  })

  test('hover 顯示操作按鈕時標籤淡出，移開後恢復', async ({ page }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[0].id
    const otherId = slots[1].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await openLabelDialog(page, view, slotId)
    await addLabels(page, ['No.025'])
    await page.getByTestId('slot-label-submit').click()

    const badge = view.getByTestId(`slot-label-${slotId}`)
    // 先把游標移到別格，確保不是停在剛操作完的那一格上
    await view.getByTestId(`slot-card-${otherId}`).hover()
    await expect(badge).toHaveCSS('opacity', '1')

    // 操作按鈕與標籤都在格位底部，hover 時標籤必須讓位
    await view.getByTestId(`slot-card-${slotId}`).hover()
    await expect(badge).toHaveCSS('opacity', '0')

    await view.getByTestId(`slot-card-${otherId}`).hover()
    await expect(badge).toHaveCSS('opacity', '1')
  })

  test('輸入重複標籤時顯示提示，且不新增第二顆', async ({ page }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await openLabelDialog(page, view, slotId)
    await addLabels(page, ['SR'])
    await addLabels(page, ['SR'])

    await expect(page.getByTestId('slot-label-duplicate')).toBeVisible()
    await expect(page.getByTestId('tag-input-tag-SR')).toHaveAttribute('data-duplicate', 'true')
    await expect(page.getByTestId('tag-input-tags').getByText('SR')).toHaveCount(1)

    await page.getByTestId('slot-label-submit').click()
    await expect.poll(() => getSlotLabels(slotId)).toEqual(['SR'])
  })

  test('達數量上限後輸入框 disabled，無法再新增', async ({ page }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await openLabelDialog(page, view, slotId)
    await addLabels(page, ['a', 'b', 'c'])
    await expect(page.getByTestId('slot-label-input')).toBeDisabled()
  })

  test('打完字未按 Enter 直接儲存，該標籤仍會存下來', async ({ page }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await openLabelDialog(page, view, slotId)
    await page.getByTestId('slot-label-input').fill('未按Enter')
    await page.getByTestId('slot-label-submit').click()

    await expect.poll(() => getSlotLabels(slotId)).toEqual(['未按Enter'])
  })

  test('清除全部只清空當前編輯內容，按儲存後才寫入 DB', async ({ page }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await openLabelDialog(page, view, slotId)
    await addLabels(page, ['No.025', 'SR'])
    await page.getByTestId('slot-label-submit').click()
    await expect(view.getByTestId(`slot-label-${slotId}`)).toBeVisible()

    await openLabelDialog(page, view, slotId)
    await page.getByTestId('slot-label-clear').click()

    // 只清空編輯中的 chips：Dialog 仍開著、DB 尚未變動
    await expect(page.getByTestId('slot-label-dialog')).toBeVisible()
    await expect(page.getByTestId('tag-input-tags')).toHaveCount(0)
    expect(await getSlotLabels(slotId)).toEqual(['No.025', 'SR'])

    await page.getByTestId('slot-label-submit').click()
    await expect(view.getByTestId(`slot-label-${slotId}`)).toHaveCount(0)
    await expect.poll(() => getSlotLabels(slotId)).toEqual([])
  })

  test('清除全部後直接關閉 Dialog，原標籤不受影響', async ({ page }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await openLabelDialog(page, view, slotId)
    await addLabels(page, ['No.025'])
    await page.getByTestId('slot-label-submit').click()
    await expect.poll(() => getSlotLabels(slotId)).toEqual(['No.025'])

    await openLabelDialog(page, view, slotId)
    await page.getByTestId('slot-label-clear').click()
    await page.keyboard.press('Escape')

    await expect(page.getByTestId('slot-label-dialog')).toHaveCount(0)
    expect(await getSlotLabels(slotId)).toEqual(['No.025'])
    await expect(view.getByTestId(`slot-label-${slotId}`)).toHaveText('No.025')
  })

  test('輸入框以 maxLength 擋住超長標籤，只留下上限字數', async ({ page }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[0].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await openLabelDialog(page, view, slotId)
    const input = page.getByTestId('slot-label-input')
    await input.fill('')
    await input.pressSequentially('abcdefghijklmnop')
    expect(await input.inputValue()).toHaveLength(8)
  })

  test('公開分享頁也看得到標籤（寫入後有 revalidate）', async ({ page, browser }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[0].id
    const shareToken = `e2elabel${Date.now().toString(16)}`.padEnd(32, '0').slice(0, 32)
    await setBinderShareToken(binder.id, shareToken)

    // 先以訪客身分看一次，讓公開頁進入快取，確認之後的更新確實走了 revalidate
    const guest = await browser.newContext()
    const guestPage = await guest.newPage()
    await guestPage.goto(`/b/${shareToken}`)
    await guestPage.getByTestId('binder-public-spread-view').waitFor()

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()
    await openLabelDialog(page, view, slotId)
    await addLabels(page, ['公開'])
    await page.getByTestId('slot-label-submit').click()
    // ⚠️ 畫面上的標籤來自樂觀更新，會先於 API 完成出現；公開頁要看到必須等真正寫入 + revalidate
    await expect.poll(() => getSlotLabels(slotId)).toEqual(['公開'])

    await guestPage.reload()
    await expect(guestPage.getByTestId(`slot-label-${slotId}`)).toHaveText('公開')
    await guest.close()
  })

  test('插入空格使卡片位移後，標籤仍跟著同一張卡', async ({ page }) => {
    const { binder, slots } = await setupBinder()
    const slotId = slots[1].id

    await page.goto(`/binders/${binder.id}`)
    const view = page.getByTestId('binder-spread-view')
    await view.waitFor()

    await openLabelDialog(page, view, slotId)
    await addLabels(page, ['跟著走'])
    await page.getByTestId('slot-label-submit').click()
    await expect.poll(() => getSlotLabels(slotId)).toEqual(['跟著走'])

    // 在同一格之前插入空格：該格往後推一格，標籤是 row 上的欄位，應隨之移動
    await view.getByTestId(`slot-card-${slotId}`).hover()
    await view.getByTestId(`slot-more-btn-${slotId}`).click()
    await page.getByTestId(`slot-insert-menu-${slotId}`).click()

    await expect
      .poll(() => getSlotPositionById(slotId).then((p) => p.slotIndex))
      .toBe(2)
    expect(await getSlotLabels(slotId)).toEqual(['跟著走'])
    await expect(view.getByTestId(`slot-label-${slotId}`)).toHaveText('跟著走')
  })
})
