/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LegalDocument } from '../legal-document'

// LegalDocument 是 async Server Component（getTranslations），依專案慣例
// 直接 await 該 async function 取得已解析的 React element 再傳入 render。
// vitest.setup.tsx 的 next-intl/server mock 固定回傳 zh-TW 訊息，
// 故 governingNotice 存在時（en/ja）的渲染由 e2e/legal.spec.ts 涵蓋。
describe('LegalDocument', () => {
  it('privacy：渲染標題、更新日期與 intro', async () => {
    render(await LegalDocument({ namespace: 'privacy' }))
    expect(screen.getByRole('heading', { level: 1, name: '隱私權政策' })).toBeInTheDocument()
    expect(screen.getByText(/最後更新：2026-07-09/)).toBeInTheDocument()
  })

  it('privacy：渲染所有 section 標題', async () => {
    render(await LegalDocument({ namespace: 'privacy' }))
    expect(screen.getByRole('heading', { name: '我們蒐集的個人資料' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '您的權利' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '聯絡我們' })).toBeInTheDocument()
  })

  it('privacy：section.items 存在時渲染為條列', async () => {
    render(await LegalDocument({ namespace: 'privacy' }))
    expect(screen.getByText(/Google LLC/)).toBeInTheDocument()
    expect(screen.getByText(/support@pocketbindr\.app/)).toBeInTheDocument()
  })

  it('zh-TW：無 governingNotice key 時不渲染提示框', async () => {
    render(await LegalDocument({ namespace: 'privacy' }))
    expect(screen.queryByText(/繁體中文版為準/)).not.toBeInTheDocument()
  })

  it('terms：渲染標題與 sections', async () => {
    render(await LegalDocument({ namespace: 'terms' }))
    expect(screen.getByRole('heading', { level: 1, name: '服務條款' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '準據法與管轄' })).toBeInTheDocument()
  })
})
