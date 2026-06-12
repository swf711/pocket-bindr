import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // 共用同一個測試帳號，平行 worker 會互相清除/建立卡冊造成 race，須序列執行
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,  // dev server 已在跑就直接用
  },
})