import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))

import { CARD_PAGE_REVALIDATE_SECONDS } from '@/lib/public-card'

// The page's `revalidate` must be a literal (Next analyses it at build time), so it cannot
// import the constant. Next uses the shortest revalidate in the tree: if the data caches
// were shorter, they would silently shorten the page's CDN lifetime.
// 攔截 modal 與獨立頁必須同樣是 on-demand ISR：modal 由 /cards 格線的每個 <Link> prefetch，
// 少了空的 generateStaticParams 就會每次請求進 function（實測為 Active CPU 最大宗）。
const PAGES: readonly [name: string, path: string][] = [
  ['獨立頁', 'src/app/[locale]/(main)/cards/[game]/[language]/[externalId]/page.tsx'],
  ['攔截 modal', 'src/app/[locale]/(main)/cards/@modal/(.)[game]/[language]/[externalId]/page.tsx'],
]

describe.each(PAGES)('卡片頁 ISR revalidate（%s）', (_name, relativePath) => {
  const source = readFileSync(join(process.cwd(), relativePath), 'utf8')

  it('頁面 revalidate 與 CARD_PAGE_REVALIDATE_SECONDS 一致', () => {
    const match = source.match(/^export const revalidate = (\d+)$/m)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBe(CARD_PAGE_REVALIDATE_SECONDS)
  })

  it('以空的 generateStaticParams 啟用 on-demand ISR（不預產 74k 頁）', () => {
    expect(source).toMatch(/export function generateStaticParams\(\) \{\s*return \[\]\s*\}/)
  })

  // 🔴 revalidate 的字串斷言抓不到「有人在頁面裡加了 request-scoped 呼叫」——那會讓 ISR
  // 靜默失效（整條 route 退回每請求 render），而測試與 build 都不會變紅。
  it('不得出現任何會強制 dynamic 的 request-scoped API', () => {
    for (const api of ['cookies(', 'headers(', 'auth(', 'connection(', 'draftMode(']) {
      expect(source).not.toContain(api)
    }
    expect(source).not.toMatch(/^export const dynamic\b/m)
  })
})
