/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
  useLinkStatus: () => ({ pending: false }),
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'
import { MainNav } from '../main-nav'

describe('MainNav active 樣式', () => {
  beforeEach(() => vi.clearAllMocks())

  it('當前 route 的 link 帶 active class 與 aria-current="page"', () => {
    vi.mocked(usePathname).mockReturnValue('/cards')
    render(<MainNav isLoggedIn />)
    const cards = screen.getByTestId('nav-cards')
    expect(cards).toHaveClass('bg-secondary-container')
    expect(cards).toHaveAttribute('aria-current', 'page')
  })

  it('非當前 route 的 link 不帶 active class / aria-current', () => {
    vi.mocked(usePathname).mockReturnValue('/cards')
    render(<MainNav isLoggedIn />)
    const binders = screen.getByTestId('nav-binders')
    expect(binders).not.toHaveClass('bg-secondary-container')
    expect(binders).not.toHaveAttribute('aria-current')
  })

  it('/binders/123 時「我的卡冊」為 active（startsWith）', () => {
    vi.mocked(usePathname).mockReturnValue('/binders/123')
    render(<MainNav isLoggedIn />)
    expect(screen.getByTestId('nav-binders')).toHaveAttribute('aria-current', 'page')
  })

  it('未登入時不渲染 我的卡冊 / 我的收藏', () => {
    vi.mocked(usePathname).mockReturnValue('/cards')
    render(<MainNav isLoggedIn={false} />)
    expect(screen.getByTestId('nav-cards')).toBeInTheDocument()
    expect(screen.queryByTestId('nav-binders')).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-collection')).not.toBeInTheDocument()
  })
})
