import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // 套件啟動前冪等預種所有 E2E 密碼帳號（fresh DB / CI 自舉，繞過 register 限流）。
  globalSetup: './e2e/global-setup.ts',
  // Specs share a single dev server + DB; several reuse test accounts/cards.
  // Serial execution avoids cross-spec race conditions (see CLAUDE.md / TECH_DEBT).
  workers: 1,
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
