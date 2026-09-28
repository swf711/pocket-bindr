/**
 * 從 src/app/globals.css 抽出 M3 色彩 token，讓 globals.css 維持單一真相（改色只需重跑
 * scripts/gen-theme-css.ts，靜態卡片頁自動跟著更新，不需手動同步兩份色票）。
 *
 * 落地頁沒有使用者可切換的 light/dark 開關（不 hydrate、無 JS），故 .dark 的變數改用
 * `@media (prefers-color-scheme: dark)` 包住、依系統偏好切換，而非依 class。
 * 高對比（prefers-contrast: more）刻意不搬——落地頁樣式本就精簡，非本次範圍。
 */

function extractBlock(css: string, selectorPattern: RegExp): string {
  const match = css.match(selectorPattern)
  if (!match) {
    throw new Error(`extractThemeTokens: 找不到符合 ${selectorPattern} 的區塊，globals.css 結構可能已變`)
  }
  return match[1].trim()
}

export function extractThemeTokens(globalsCss: string): string {
  // `:root,\n.light {...}`：第一個 :root 區塊，逗號延伸選擇器不影響比對。
  const lightVars = extractBlock(globalsCss, /:root[^{]*\{([^}]*)\}/)
  // `.dark {...}`：第一個 .dark 區塊（高對比區塊在 @media 內，不會被此正則命中）。
  const darkVars = extractBlock(globalsCss, /\.dark\s*\{([^}]*)\}/)

  return [
    `:root {\n${lightVars}\n}`,
    '@media (prefers-color-scheme: dark) {',
    `  :root {\n${darkVars
      .split('\n')
      .map(line => (line.trim() ? `  ${line.trim()}` : ''))
      .join('\n')}\n  }`,
    '}',
  ].join('\n')
}
