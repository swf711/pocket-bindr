/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockUseLinkStatus = vi.fn()
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
  useLinkStatus: () => mockUseLinkStatus(),
}))

import { NavProgressBar, PendingLink } from '../pending-link'

describe('NavProgressBar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('pending=false 時不渲染進度條', () => {
    mockUseLinkStatus.mockReturnValue({ pending: false })
    render(<NavProgressBar />)
    expect(screen.queryByTestId('nav-progress')).not.toBeInTheDocument()
  })

  it('pending=true 時渲染置頂進度條', () => {
    mockUseLinkStatus.mockReturnValue({ pending: true })
    render(<NavProgressBar />)
    expect(screen.getByTestId('nav-progress')).toBeInTheDocument()
  })
})

describe('PendingLink', () => {
  beforeEach(() => vi.clearAllMocks())

  it('透傳 href / data-testid 並渲染子元素', () => {
    mockUseLinkStatus.mockReturnValue({ pending: false })
    render(<PendingLink href="/binders" data-testid="nav-binders">我的卡冊</PendingLink>)
    const link = screen.getByTestId('nav-binders')
    expect(link).toHaveAttribute('href', '/binders')
    expect(link).toHaveTextContent('我的卡冊')
  })

  it('該 Link pending 時帶出進度條', () => {
    mockUseLinkStatus.mockReturnValue({ pending: true })
    render(<PendingLink href="/binders">我的卡冊</PendingLink>)
    expect(screen.getByTestId('nav-progress')).toBeInTheDocument()
  })
})
