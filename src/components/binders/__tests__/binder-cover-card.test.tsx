/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BinderCoverCard } from '../binder-cover-card'
import type { BinderSummary } from '@/types/binder'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function makeBinder(overrides: Partial<BinderSummary> = {}): BinderSummary {
  return {
    id: 'b1',
    name: 'Test Binder',
    gridType: 'grid_3x3',
    coverColor: '#4A5568',
    settings: null,
    createdAt: new Date().toISOString(),
    _count: { slots: 5 },
    ...overrides,
  }
}

describe('BinderCoverCard', () => {
  it('深色背景時文字顏色為淺色 (#F7FAFC)', () => {
    const { container } = render(
      <BinderCoverCard
        binder={makeBinder({ coverColor: '#1A202C' })}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    const root = container.querySelector('[data-testid="binder-card"]') as HTMLElement
    expect(root.style.color).toBe('rgb(247, 250, 252)')  // #F7FAFC
  })

  it('淺色背景時文字顏色為深色 (#1A202C)', () => {
    const { container } = render(
      <BinderCoverCard
        binder={makeBinder({ coverColor: '#FFFFFF' })}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    const root = container.querySelector('[data-testid="binder-card"]') as HTMLElement
    expect(root.style.color).toBe('rgb(26, 32, 44)')  // #1A202C
  })

  it('顯示卡冊名稱、格式與卡片數量', () => {
    render(
      <BinderCoverCard
        binder={makeBinder({ name: 'My Binder', gridType: 'grid_3x3', _count: { slots: 12 } })}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    expect(screen.getByText('My Binder')).toBeInTheDocument()
    expect(screen.getByText('3×3')).toBeInTheDocument()
    expect(screen.getByText('12 張卡')).toBeInTheDocument()
  })
})
