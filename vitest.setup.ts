import { vi } from 'vitest'
import * as React from 'react'
import { NextIntlClientProvider, createTranslator } from 'next-intl'
import zhTW from './messages/zh-TW.json'

// Every component migrated to next-intl needs a NextIntlClientProvider ancestor
// to call useTranslations(). Rather than touching every existing test file's
// local render() wrapper, wrap @testing-library/react's render globally with
// zh-TW messages (the source locale — existing tests assert on Chinese text).
vi.mock('@testing-library/react', async () => {
  const actual = await vi.importActual<typeof import('@testing-library/react')>(
    '@testing-library/react',
  )
  return {
    ...actual,
    render: (ui: React.ReactElement, options?: Parameters<typeof actual.render>[1]) =>
      actual.render(
        React.createElement(NextIntlClientProvider, { locale: 'zh-TW', messages: zhTW, children: ui }),
        options,
      ),
  }
})

// `next-intl/server`'s getTranslations/getMessages/getLocale rely on Next's
// request-scoped headers()/cookies(), unavailable outside a real Next server —
// including in Vitest. Mock them with the same createTranslator core used by
// the client provider above, so async Server Components (RSC tests calling
// `await Component()` directly) resolve zh-TW text without a Next runtime.
vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace?: string) =>
    createTranslator(
      { locale: 'zh-TW', messages: zhTW, namespace } as Parameters<typeof createTranslator>[0],
    ),
  getMessages: async () => zhTW,
  getLocale: async () => 'zh-TW',
  getFormatter: async () => ({}),
  getNow: async () => new Date(),
  getTimeZone: async () => undefined,
  setRequestLocale: () => {},
}))
