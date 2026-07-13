import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // 套件啟動前冪等預種所有 E2E 密碼帳號（fresh DB / CI 自舉，繞過 register 限流）。
  globalSetup: './e2e/global-setup.ts',
  // Specs share a single dev server + DB; several reuse test accounts/cards.
  // Serial execution avoids cross-spec race conditions (see CLAUDE.md / TECH_DEBT).
  workers: 1,
  // /cards 點卡開啟卡片詳情由 feat/card-detail-url 起改走 Intercepting Route——點擊需 Next 取回
  // @modal 路由的 RSC payload 才顯示 Drawer（production 靠 <Link> prefetch 感覺即時，但 E2E 立即
  // 程式化點擊常搶在 prefetch 完成前，首次/負載下偶超過預設 5s）。全域 expect 逾時提高到 10s 吸收此
  // 變動，涵蓋所有點卡開 modal 的斷言點，避免逐一 patch 遺漏。
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    // Pin the browser's Accept-Language to zh-TW so first-visit locale detection
    // (src/i18n/locale.ts resolveLocale) resolves to the source locale — existing
    // specs assert on Chinese text and must not be affected by CI runner locale.
    locale: 'zh-TW',
  },
  webServer: {
    // Run E2E against a production build (next start), not `next dev`.
    // `next dev` compiles routes on-demand → first hit to each route can exceed the
    // per-action timeout, causing flaky timeouts. A production server serves
    // pre-compiled pages instantly. AUTH_TRUST_HOST=true is required for NextAuth v5
    // in production mode to trust the localhost Host header (auto-trusted only in dev).
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,  // 本地已在跑就直接用；CI 一律重建
    timeout: 240_000,                       // build + start 首次較久
    env: { AUTH_TRUST_HOST: 'true' },
  },
})
