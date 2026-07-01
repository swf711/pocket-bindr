/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeaturePlatformSection } from '../feature-platform-section'

// FeaturePlatformSection 是 async Server Component（getTranslations），
// render(<FeaturePlatformSection />) 無法同步取得已解析內容；改直接呼叫並 await
// 該 async function 取得已解析的 React element 再傳入 render（RSC 測試慣例）。
describe('FeaturePlatformSection', () => {
  it('有 data-testid="feature-platform-section"', async () => {
    render(await FeaturePlatformSection())
    expect(screen.getByTestId('feature-platform-section')).toBeInTheDocument()
  })

  it('顯示 6 個功能卡片標題', async () => {
    render(await FeaturePlatformSection())
    const titles = ['搜尋卡牌', '建立卡冊', '管理收藏', '裝置同步', '分享你的卡冊', '更多功能']
    titles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument()
    })
  })

  it('管理收藏描述包含「各式尺寸」', async () => {
    render(await FeaturePlatformSection())
    expect(screen.getByText(/各式尺寸/)).toBeInTheDocument()
  })

  it('分享你的卡冊描述包含「即將推出」標示', async () => {
    render(await FeaturePlatformSection())
    expect(screen.getByText(/分享你的卡冊/)).toBeInTheDocument()
    const allComingSoon = screen.getAllByText(/即將推出/)
    expect(allComingSoon.length).toBeGreaterThanOrEqual(1)
  })

  it('顯示「平台功能」大標題', async () => {
    render(await FeaturePlatformSection())
    expect(screen.getByRole('heading', { name: '平台功能' })).toBeInTheDocument()
  })
})
