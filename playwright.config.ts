import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // Specs share a single dev server + DB; several reuse test accounts/cards.
  // Serial execution avoids cross-spec race conditions (see CLAUDE.md / TECH_DEBT).
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
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
