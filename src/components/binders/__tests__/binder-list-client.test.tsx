/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render as baseRender, screen, fireEvent } from '@testing-library/react'
import { BinderListClient } from '../binder-list-client'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { BinderSummary } from '@/types/binder'

// 封面卡 ⋮ 操作按鈕已改用 Tooltip，需 TooltipProvider context（正式環境由 root layout 提供）
const render = ((ui: Parameters<typeof baseRender>[0]) =>
  baseRender(ui, { wrapper: TooltipProvider })) as typeof baseRender

const mockReplace = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}))

vi.mock('sonner', () => ({
  toast: vi.fn(),
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
    shareToken: null,
    createdAt: new Date().toISOString(),
    _count: { slots: 0 },
    ...overrides,
  }
}

describe('BinderListClient', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams()
    mockReplace.mockClear()
  })

  it('無卡冊時顯示空狀態 empty-binder-state', () => {
    render(<BinderListClient initialBinders={[]} />)
    expect(screen.getByTestId('empty-binder-state')).toBeInTheDocument()
  })

  it('無卡冊時不顯示 add-binder-slot', () => {
    render(<BinderListClient initialBinders={[]} />)
    expect(screen.queryByTestId('add-binder-slot')).not.toBeInTheDocument()
  })

  it('有卡冊（< 3 本）時顯示 add-binder-slot 在 grid 中', () => {
    render(<BinderListClient initialBinders={[makeBinder()]} />)
    expect(screen.getByTestId('add-binder-slot')).toBeInTheDocument()
  })

  it('已有 3 本卡冊時不顯示 add-binder-slot', () => {
    const binders = [
      makeBinder({ id: 'b1' }),
      makeBinder({ id: 'b2' }),
      makeBinder({ id: 'b3' }),
    ]
    render(<BinderListClient initialBinders={binders} />)
    expect(screen.queryByTestId('add-binder-slot')).not.toBeInTheDocument()
  })

  it('統計顯示目前卡冊數量', () => {
    render(<BinderListClient initialBinders={[makeBinder()]} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(/\/ 3 本/)).toBeInTheDocument()
  })

  it('空狀態時統計顯示 0', () => {
    render(<BinderListClient initialBinders={[]} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText(/\/ 3 本/)).toBeInTheDocument()
  })

  it('點擊 add-binder-slot 開啟 CreateBinderDialog', () => {
    render(<BinderListClient initialBinders={[makeBinder()]} />)
    const slot = screen.getByTestId('add-binder-slot')
    fireEvent.click(slot)
    expect(screen.getByTestId('binder-name-input')).toBeInTheDocument()
  })

  it('空狀態點擊「建立第一本卡冊」開啟 CreateBinderDialog', () => {
    render(<BinderListClient initialBinders={[]} />)
    fireEvent.click(screen.getByText('建立第一本卡冊'))
    expect(screen.getByTestId('binder-name-input')).toBeInTheDocument()
  })

  it('?new=1 且未達上限時自動開啟 CreateBinderDialog', () => {
    mockSearchParams = new URLSearchParams('new=1')
    render(<BinderListClient initialBinders={[makeBinder()]} />)
    expect(screen.getByTestId('binder-name-input')).toBeInTheDocument()
    expect(mockReplace).toHaveBeenCalledWith('/binders')
  })

  it('?new=1 但已達上限時不自動開啟 CreateBinderDialog', () => {
    mockSearchParams = new URLSearchParams('new=1')
    const binders = [
      makeBinder({ id: 'b1' }),
      makeBinder({ id: 'b2' }),
      makeBinder({ id: 'b3' }),
    ]
    render(<BinderListClient initialBinders={binders} />)
    expect(screen.queryByTestId('binder-name-input')).not.toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
