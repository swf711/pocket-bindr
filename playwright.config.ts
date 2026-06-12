import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  workers: process.env.CI ? 4 : undefined,
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,  // dev server 已在跑就直接用
    timeout: 120_000,           // 平行首壓時 dev compile 較慢
  },
})
