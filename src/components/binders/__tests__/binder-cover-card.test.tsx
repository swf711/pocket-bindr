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
        binder={makeBinder({ name: 'My Binder', gridType: 'grid_4x3', _count: { slots: 12 } })}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    expect(screen.getByText('My Binder')).toBeInTheDocument()
    expect(screen.getByText('4×3')).toBeInTheDocument()
    expect(screen.getByText('12 張卡')).toBeInTheDocument()
  })

  it('edit/delete 按鈕區預設有 opacity-0 class（hover 前不可見）', () => {
    const { container } = render(
      <BinderCoverCard binder={makeBinder()} onEdit={() => {}} onDelete={() => {}} />,
    )
    const buttonWrapper = container.querySelector('.opacity-0')
    expect(buttonWrapper).toBeInTheDocument()
    expect(buttonWrapper).toContainElement(screen.getByTestId('edit-binder-btn'))
    expect(buttonWrapper).toContainElement(screen.getByTestId('delete-binder-btn'))
  })

  it('書脊 div 存在並套用 coverColor', () => {
    const { container } = render(
      <BinderCoverCard binder={makeBinder({ coverColor: '#FF5733' })} onEdit={() => {}} onDelete={() => {}} />,
    )
    const spine = container.querySelector('[data-testid="binder-spine"]') as HTMLElement
    expect(spine).toBeInTheDocument()
    expect(spine.style.backgroundColor).toBe('rgb(255, 87, 51)')
  })

  it('封面套用 aspect-2.5/3.5（與卡片搜尋一致）', () => {
    const { container } = render(
      <BinderCoverCard binder={makeBinder()} onEdit={() => {}} onDelete={() => {}} />,
    )
    const root = container.querySelector('[data-testid="binder-card"]') as HTMLElement
    expect(root.className).toContain('aspect-2.5/3.5')
  })

  it('顯示建立日期', () => {
    render(
      <BinderCoverCard
        binder={makeBinder({ createdAt: '2024-03-15T00:00:00.000Z' })}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })
})
