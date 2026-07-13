import { test as base, expect } from '@playwright/test'
import { waitForStreamSettled } from './hydration'

/**
 * 全套 E2E 的統一入口：所有 spec 一律 `import { test, expect } from './helpers/test'`，
 * 不直接 import '@playwright/test'。
 *
 * 覆寫 `page.goto`：導航完成後自動等 React 串流內容歸位（原因見 hydration.ts）。
 *
 * 為何攔在這裡、而不是逐檔加等待：串流暫存區造成的 strict mode violation 會出現在
 * 「導航後立即操作」的**任何**位置——實測命中 /settings、/binders/[id]、/collection 等多處，
 * 逐檔補是打地鼠。統一在 goto 出口攔一次，全套自動受惠，新寫的 spec 也預設安全。
 *
 * 註：串流暫存區不存在時該等待立即通過，故對未觸發串流的頁面零成本。
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page)
    page.goto = async (url, options) => {
      const response = await originalGoto(url, options)
      await waitForStreamSettled(page)
      return response
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture 的 `use` 不是 React Hook，只是撞名
    await use(page)
  },
})

export { expect }
export type { Page } from '@playwright/test'
