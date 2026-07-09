import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

// 回歸測試：防止 globals.css 的 `@theme inline` 橋接區塊漏寫 --color-X 映射，
// 曾發生 --destructive-foreground 有 :root 變數值但沒有對應 --color-destructive-foreground
// 橋接行，導致 text-destructive-foreground 這個 class 完全沒有 CSS 規則被產生（見 docs/PATTERNS.md
// 「M3 色彩角色系統」段）。此測試逐一核對 :root 內每個 `-foreground` 後綴變數，其本體與
// -foreground 版本都必須在 `@theme inline` 有對應 --color-* 橋接行。
describe('globals.css: @theme inline 橋接完整性', () => {
  const cssPath = path.resolve(__dirname, '../../app/globals.css')
  const css = readFileSync(cssPath, 'utf-8')

  const rootBlockMatch = css.match(/:root\s*{([^}]*)}/)
  if (!rootBlockMatch) throw new Error('找不到 :root 區塊，globals.css 結構可能已變更')
  const rootBlock = rootBlockMatch[1]

  const themeInlineMatch = css.match(/@theme inline\s*{([\s\S]*?)\n}/)
  if (!themeInlineMatch) throw new Error('找不到 @theme inline 區塊，globals.css 結構可能已變更')
  const themeInlineBlock = themeInlineMatch[1]

  const rootVarNames = [...rootBlock.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1])
  const foregroundVars = rootVarNames.filter((name) => name.endsWith('-foreground'))
  const baseVars = foregroundVars.map((name) => name.replace(/-foreground$/, ''))

  it.each(baseVars)('--%s 與 --%s-foreground 皆有 @theme inline 的 --color-* 橋接行', (base) => {
    expect(themeInlineBlock).toMatch(new RegExp(`--color-${base}:\\s*var\\(--${base}\\)`))
    expect(themeInlineBlock).toMatch(
      new RegExp(`--color-${base}-foreground:\\s*var\\(--${base}-foreground\\)`),
    )
  })
})
