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

  it('/ → 正常渲染', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    render(<Footer />)
    expect(screen.getByTestId('site-footer')).toBeInTheDocument()
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
    vi.mocked(usePathname).mockReturnValue('/')
    render(<Footer />)
    expect(screen.getByTestId('site-footer')).toHaveTextContent('© 2026 TCG Binder')
  })

  it('包含免責聲明', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    render(<Footer />)
    expect(screen.getByTestId('site-footer')).toHaveTextContent('Nintendo')
    expect(screen.getByTestId('site-footer')).toHaveTextContent('Pokémon')
    expect(screen.getByTestId('site-footer')).toHaveTextContent('Bandai')
  })
})
