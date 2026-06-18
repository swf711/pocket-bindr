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
    description: null,
    settings: null,
    sortOrder: 0,
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

  it('卡冊名稱顯示在封面上方水印區（data-testid=binder-name）', () => {
    render(
      <BinderCoverCard
        binder={makeBinder({ name: 'My Binder' })}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    const nameEl = screen.getByTestId('binder-name')
    expect(nameEl).toBeInTheDocument()
    expect(nameEl).toHaveTextContent('My Binder')
    expect(nameEl.className).toContain('top-20')
    expect(nameEl.className).toContain('left-6')
  })

  it('格式與卡數顯示在左下角（data-testid=binder-info）', () => {
    render(
      <BinderCoverCard
        binder={makeBinder({ gridType: 'grid_3x3', _count: { slots: 12 } })}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    const infoEl = screen.getByTestId('binder-info')
    expect(infoEl).toBeInTheDocument()
    expect(infoEl).toHaveTextContent('3×3')
    expect(infoEl).toHaveTextContent('12 張卡')
    expect(infoEl.className).toContain('bottom-5')
    expect(infoEl.className).toContain('left-6')
  })

  it('有 description 時顯示在封面（data-testid=binder-description）', () => {
    render(
      <BinderCoverCard
        binder={makeBinder({ description: '我的測試卡冊描述' })}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    const descEl = screen.getByTestId('binder-description')
    expect(descEl).toBeInTheDocument()
    expect(descEl).toHaveTextContent('我的測試卡冊描述')
  })

  it('無 description 時不顯示描述區塊', () => {
    render(
      <BinderCoverCard
        binder={makeBinder({ description: null })}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    expect(screen.queryByTestId('binder-description')).not.toBeInTheDocument()
  })

  it('進入卡冊按鈕（ArrowRight）存在於右上角 action group 內', () => {
    const { container } = render(
      <BinderCoverCard binder={makeBinder()} onEdit={() => {}} onDelete={() => {}} />,
    )
    const actionGroup = container.querySelector('.opacity-0')
    expect(actionGroup).toBeInTheDocument()
    expect(actionGroup?.className).toContain('top-2')
    expect(actionGroup?.className).toContain('right-2')
    const enterBtn = screen.getByTestId('enter-binder-btn')
    expect(enterBtn).toBeInTheDocument()
    expect(actionGroup).toContainElement(enterBtn)
  })

  it('edit/delete 按鈕在右上角 action group 內', () => {
    const { container } = render(
      <BinderCoverCard binder={makeBinder()} onEdit={() => {}} onDelete={() => {}} />,
    )
    const actionGroup = container.querySelector('.opacity-0')
    expect(actionGroup).toContainElement(screen.getByTestId('edit-binder-btn'))
    expect(actionGroup).toContainElement(screen.getByTestId('delete-binder-btn'))
  })

  it('書脊 div 存在並套用 coverColor', () => {
    const { container } = render(
      <BinderCoverCard binder={makeBinder({ coverColor: '#FF5733' })} onEdit={() => {}} onDelete={() => {}} />,
    )
    const spine = container.querySelector('[data-testid="binder-spine"]') as HTMLElement
    expect(spine).toBeInTheDocument()
    expect(spine.style.backgroundColor).toBe('rgb(255, 87, 51)')
  })

  it('封面套用 aspect-2.5/3.5（與卡牌搜尋一致）', () => {
    const { container } = render(
      <BinderCoverCard binder={makeBinder()} onEdit={() => {}} onDelete={() => {}} />,
    )
    const root = container.querySelector('[data-testid="binder-card"]') as HTMLElement
    expect(root.className).toContain('aspect-2.5/3.5')
  })
})
