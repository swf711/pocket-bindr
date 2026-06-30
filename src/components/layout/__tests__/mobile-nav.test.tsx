/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

// Sheet 內容在關閉狀態不渲染；mock 成直接渲染 children 以便測試 nav 連結
vi.mock('@/components/ui/sheet', () => {
  const Pass = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  return {
    Sheet: Pass,
    SheetClose: Pass,
    SheetContent: Pass,
    SheetHeader: Pass,
    SheetTitle: Pass,
    SheetTrigger: Pass,
  }
})

import { usePathname } from 'next/navigation'
import { MobileNav } from '../mobile-nav'

describe('MobileNav active 樣式', () => {
  beforeEach(() => vi.clearAllMocks())

  it('當前 route 的 link 帶 active class 與 aria-current="page"', () => {
    vi.mocked(usePathname).mockReturnValue('/collection')
    render(<MobileNav isLoggedIn username="brian" />)
    const collection = screen.getByTestId('mobile-nav-collection')
    expect(collection).toHaveClass('bg-secondary-container')
    expect(collection).toHaveAttribute('aria-current', 'page')
  })

  it('非當前 route 的 link 不帶 active class', () => {
    vi.mocked(usePathname).mockReturnValue('/collection')
    render(<MobileNav isLoggedIn username="brian" />)
    const cards = screen.getByTestId('mobile-nav-cards')
    expect(cards).not.toHaveClass('bg-secondary-container')
    expect(cards).not.toHaveAttribute('aria-current')
  })

  it('/binders/123 時「我的卡冊」為 active（startsWith）', () => {
    vi.mocked(usePathname).mockReturnValue('/binders/123')
    render(<MobileNav isLoggedIn username="brian" />)
    expect(screen.getByTestId('mobile-nav-binders')).toHaveAttribute('aria-current', 'page')
  })

  it('首頁 / 僅在 pathname === / 時 active', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    render(<MobileNav isLoggedIn username="brian" />)
    expect(screen.getByTestId('mobile-nav-home')).toHaveAttribute('aria-current', 'page')
  })

  it('未登入時不渲染 我的卡冊 / 我的收藏', () => {
    vi.mocked(usePathname).mockReturnValue('/cards')
    render(<MobileNav isLoggedIn={false} username="訪客" />)
    expect(screen.getByTestId('mobile-nav-cards')).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-nav-binders')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mobile-nav-collection')).not.toBeInTheDocument()
  })
})
