import { expect, type Page } from '@playwright/test'

/**
 * 等待 React 串流 SSR 的內容全部「歸位」後才與頁面互動。
 *
 * 為何需要（實測結論，非臆測）：React 串流會先把後到的 Suspense 內容塞進隱藏暫存容器
 * `<div hidden id="S:0">`，再由 `$RC` script 搬到正確位置並移除暫存。在搬移完成前，
 * **同一份內容同時存在於暫存區與真實位置**——實測抓到 `current-password-input` 兩個，
 * 其一 `visible: true`（真實位置）、其一 `inHiddenContainer: true, ancestorTag: "DIV#S:0"`。
 *
 * 這**不是 app bug**：暫存副本是隱藏的、毫秒內就被移除，真實使用者不會看到。但 Playwright 的
 * strict mode 會把隱藏的暫存副本一併算進匹配數，於是 `fill()` / `click()` 拋 strict mode violation。
 *
 * 序列執行時 CPU 充裕、搬移瞬間完成，測試總是贏；**並行執行時多個 Chromium 搶 CPU，
 * 搬移 script 被排隊延遲，窗口被拉長才會撞上**。此處是明確等它歸位，不是遮蓋問題。
 *
 * 註：暫存容器不存在時 `toHaveCount(0)` 立即通過，故對未觸發串流的頁面零成本。
 */
export async function waitForStreamSettled(page: Page): Promise<void> {
  await expect(page.locator('div[hidden][id^="S:"]')).toHaveCount(0)
}
