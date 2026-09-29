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

let mockStatus: 'loading' | 'authenticated' | 'unauthenticated' = 'unauthenticated'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: mockStatus }),
}))

import { HeroMyBindersButton } from '../hero-my-binders-button'

describe('HeroMyBindersButton', () => {
  beforeEach(() => {
    mockStatus = 'unauthenticated'
  })

  it('status=loading 時不渲染', () => {
    mockStatus = 'loading'
    render(<HeroMyBindersButton />)
    expect(screen.queryByRole('link', { name: '我的卡冊' })).not.toBeInTheDocument()
  })

  it('unauthenticated 時不渲染', () => {
    mockStatus = 'unauthenticated'
    render(<HeroMyBindersButton />)
    expect(screen.queryByRole('link', { name: '我的卡冊' })).not.toBeInTheDocument()
  })

  it('authenticated 時渲染連到 /binders 的連結', () => {
    mockStatus = 'authenticated'
    render(<HeroMyBindersButton />)
    const link = screen.getByRole('link', { name: '我的卡冊' })
    expect(link).toHaveAttribute('href', '/binders')
  })
})
