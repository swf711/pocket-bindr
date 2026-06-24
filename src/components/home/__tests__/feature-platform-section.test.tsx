/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeaturePlatformSection } from '../feature-platform-section'

describe('FeaturePlatformSection', () => {
  it('有 data-testid="feature-platform-section"', () => {
    render(<FeaturePlatformSection />)
    expect(screen.getByTestId('feature-platform-section')).toBeInTheDocument()
  })

  it('顯示 6 個功能卡片標題', () => {
    render(<FeaturePlatformSection />)
    const titles = ['搜尋卡牌', '建立卡冊', '管理收藏', '裝置同步', '分享你的卡冊', '更多功能']
    titles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument()
    })
  })

  it('管理收藏描述包含「各式尺寸」', () => {
    render(<FeaturePlatformSection />)
    expect(screen.getByText(/各式尺寸/)).toBeInTheDocument()
  })

  it('分享你的卡冊描述包含「即將推出」標示', () => {
    render(<FeaturePlatformSection />)
    expect(screen.getByText(/分享你的卡冊/)).toBeInTheDocument()
    const allComingSoon = screen.getAllByText(/即將推出/)
    expect(allComingSoon.length).toBeGreaterThanOrEqual(1)
  })

  it('顯示「平台功能」大標題', () => {
    render(<FeaturePlatformSection />)
    expect(screen.getByRole('heading', { name: '平台功能' })).toBeInTheDocument()
  })
})
