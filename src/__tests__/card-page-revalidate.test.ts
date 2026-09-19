import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))

import { CARD_PAGE_REVALIDATE_SECONDS } from '@/lib/public-card'

// The page's `revalidate` must be a literal (Next analyses it at build time), so it cannot
// import the constant. Next uses the shortest revalidate in the tree: if the data caches
// were shorter, they would silently shorten the page's CDN lifetime.
const PAGE = join(
  process.cwd(),
  'src/app/[locale]/(main)/cards/[game]/[language]/[externalId]/page.tsx',
)

describe('卡片頁 ISR revalidate', () => {
  const source = readFileSync(PAGE, 'utf8')

  it('頁面 revalidate 與 CARD_PAGE_REVALIDATE_SECONDS 一致', () => {
    const match = source.match(/^export const revalidate = (\d+)$/m)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBe(CARD_PAGE_REVALIDATE_SECONDS)
  })

  it('以空的 generateStaticParams 啟用 on-demand ISR（不預產 74k 頁）', () => {
    expect(source).toMatch(/export function generateStaticParams\(\) \{\s*return \[\]\s*\}/)
  })
})
