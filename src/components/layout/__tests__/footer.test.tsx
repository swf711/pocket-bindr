/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from '../footer'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}))

import { usePathname } from 'next/navigation'

describe('Footer', () => {
  it('/binders/123 → return null（保護 h-full 鏈）', () => {
    vi.mocked(usePathname).mockReturnValue('/binders/123')
    const { container } = render(<Footer />)
    expect(container.firstChild).toBeNull()
  })

  it('/binders/abc-def-123 → return null', () => {
    vi.mocked(usePathname).mockReturnValue('/binders/abc-def-123')
    const { container } = render(<Footer />)
    expect(container.firstChild).toBeNull()
  })

  it('/login → return null', () => {
    vi.mocked(usePathname).mockReturnValue('/login')
    const { container } = render(<Footer />)
    expect(container.firstChild).toBeNull()
  })

  it('/register → return null', () => {
    vi.mocked(usePathname).mockReturnValue('/register')
    const { container } = render(<Footer />)
    expect(container.firstChild).toBeNull()
  })

  it('/binders（列表頁）→ 正常渲染', () => {
    vi.mocked(usePathname).mockReturnValue('/binders')
    render(<Footer />)
    expect(screen.getByTestId('site-footer')).toBeInTheDocument()
  })

  it('/ → return null（首頁使用 inline footer）', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    const { container } = render(<Footer />)
    expect(container.firstChild).toBeNull()
  })

  it('/cards → 正常渲染', () => {
    vi.mocked(usePathname).mockReturnValue('/cards')
    render(<Footer />)
    expect(screen.getByTestId('site-footer')).toBeInTheDocument()
  })

  it('/settings → 正常渲染', () => {
    vi.mocked(usePathname).mockReturnValue('/settings')
    render(<Footer />)
    expect(screen.getByTestId('site-footer')).toBeInTheDocument()
  })

  it('包含版權文字', () => {
    vi.mocked(usePathname).mockReturnValue('/cards')
    render(<Footer />)
    expect(screen.getByTestId('site-footer')).toHaveTextContent('© 2026 PocketBindr')
  })

  it('包含免責聲明', () => {
    vi.mocked(usePathname).mockReturnValue('/cards')
    render(<Footer />)
    expect(screen.getByTestId('site-footer')).toHaveTextContent('Nintendo')
    expect(screen.getByTestId('site-footer')).toHaveTextContent('Pokémon')
    expect(screen.getByTestId('site-footer')).toHaveTextContent('Bandai')
  })

  it('包含服務條款與隱私權政策連結', () => {
    vi.mocked(usePathname).mockReturnValue('/cards')
    render(<Footer />)
    expect(screen.getByRole('link', { name: '服務條款' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: '隱私權政策' })).toHaveAttribute('href', '/privacy')
  })

  it('顯示應用程式版號（顯示層加 v 前綴）', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '1.0.0')
    vi.mocked(usePathname).mockReturnValue('/cards')
    render(<Footer />)
    expect(screen.getByTestId('site-footer')).toHaveTextContent('v1.0.0')
    vi.unstubAllEnvs()
  })

  it('包含 GitHub repo 連結', () => {
    vi.mocked(usePathname).mockReturnValue('/cards')
    render(<Footer />)
    const link = screen.getByRole('link', { name: /GitHub/ })
    expect(link).toHaveAttribute('href', 'https://github.com/swf711/pocket-bindr')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
