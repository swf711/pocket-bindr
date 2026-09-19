import { describe, it, expect, vi } from 'vitest'

// The global setup mocks next-intl/server without getRequestConfig; here it is the
// identity so the config callback can be called directly.
vi.mock('next-intl/server', () => ({
  getRequestConfig: (fn: unknown) => fn,
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => {
    throw new Error('request config must not read cookies() — it makes every route dynamic')
  }),
  headers: vi.fn(() => {
    throw new Error('request config must not read headers() — it makes every route dynamic')
  }),
}))

import requestConfig from '../request'

type Config = (params: { requestLocale: Promise<string | undefined> }) => Promise<{
  locale: string
  messages: Record<string, unknown>
}>
const getConfig = requestConfig as unknown as Config

describe('i18n request config', () => {
  it('採用 [locale] 段傳入的 requestLocale', async () => {
    const config = await getConfig({ requestLocale: Promise.resolve('ja') })
    expect(config.locale).toBe('ja')
    expect(config.messages).toHaveProperty('common')
  })

  it('requestLocale 缺值或不合法 → zh-TW', async () => {
    expect((await getConfig({ requestLocale: Promise.resolve(undefined) })).locale).toBe('zh-TW')
    expect((await getConfig({ requestLocale: Promise.resolve('xx') })).locale).toBe('zh-TW')
  })
})
