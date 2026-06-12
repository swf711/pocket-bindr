import { expect, type Locator, type Page } from '@playwright/test'

/**
 * dnd-kit PointerSensor 拖拉模擬（activationConstraint distance: 8，
 * 見 src/components/binder/binder-grid.tsx / binder-spread-view.tsx）。
 *
 * 關鍵：down 後不可一步移到終點——必須先小幅移動越過 8px activation
 * distance，等 source 出現 opacity-40（isDragging）確認 drag 已啟動。
 */

/** 啟動 drag：移到 source 中心 → down → 移 +12px（steps: 3）→ 等 opacity-40 */
export async function startDrag(page: Page, source: Locator): Promise<void> {
  const box = await source.boundingBox()
  if (!box) throw new Error('startDrag: source 無 boundingBox（不可見？）')
  // 起點用格位中心，避開頂部 hover 浮現的 toggle/delete 按鈕
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  // 小幅移動越過 8px activation distance
  await page.mouse.move(cx + 12, cy, { steps: 3 })
  // isDragging → opacity-40，確認 drag 確實啟動
  await expect(source).toHaveClass(/opacity-40/)
}

/**
 * 分步移到 target 中心（steps: 15 讓 collision detection 持續更新，
 * 結尾補一發 move）→ 等 droppable highlight（有卡格位 ring-2 /
 * 空格位 border-primary）→ mouse.up 放開。
 */
export async function dropOn(page: Page, target: Locator): Promise<void> {
  const box = await target.boundingBox()
  if (!box) throw new Error('dropOn: target 無 boundingBox（不可見？）')
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy, { steps: 15 })
  await page.mouse.move(cx, cy)
  // 等 droppable isOver highlight，比 waitForTimeout 穩
  await expect(target).toHaveClass(/ring-2|border-primary/)
  await page.mouse.up()
}

/** 組合：startDrag + dropOn */
export async function dragSlotTo(page: Page, source: Locator, target: Locator): Promise<void> {
  await startDrag(page, source)
  await dropOn(page, target)
}
