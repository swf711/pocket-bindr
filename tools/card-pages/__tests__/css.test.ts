import { describe, it, expect } from 'vitest'
import { extractThemeTokens } from '../css'

const SAMPLE_CSS = `
@import "tailwindcss";

:root,
.light {
  --background: oklch(98% 0 0);
  --foreground: oklch(20% 0 0);
}

.dark {
  --background: oklch(10% 0 0);
  --foreground: oklch(95% 0 0);
}

@media (prefers-contrast: more) {
  :root, .light { --background: oklch(100% 0 0); }
}
`

describe('extractThemeTokens', () => {
  it('抽出 :root 區塊為預設（light）token', () => {
    const css = extractThemeTokens(SAMPLE_CSS)
    expect(css).toContain(':root {')
    expect(css).toContain('--background: oklch(98% 0 0);')
    expect(css).toContain('--foreground: oklch(20% 0 0);')
  })

  it('.dark 區塊轉為 @media (prefers-color-scheme: dark) 包住的 :root', () => {
    const css = extractThemeTokens(SAMPLE_CSS)
    expect(css).toContain('@media (prefers-color-scheme: dark)')
    expect(css).toContain('--background: oklch(10% 0 0);')
    expect(css).toContain('--foreground: oklch(95% 0 0);')
  })

  it('不誤抓高對比 @media 區塊內的 :root', () => {
    const css = extractThemeTokens(SAMPLE_CSS)
    // 高對比區塊的 --background 值（100%）不應出現在抽出結果中
    expect(css).not.toContain('oklch(100% 0 0)')
  })

  it('找不到 :root 或 .dark 區塊時直接 throw，不靜默產出沒有樣式的頁面', () => {
    expect(() => extractThemeTokens('body { color: red; }')).toThrow()
    expect(() => extractThemeTokens(':root { --a: 1; }')).toThrow()
  })
})
