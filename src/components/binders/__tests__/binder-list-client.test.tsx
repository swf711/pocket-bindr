/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BinderListClient } from '../binder-list-client'
import type { BinderSummary } from '@/types/binder'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
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
    settings: null,
    createdAt: new Date().toISOString(),
    _count: { slots: 0 },
    ...overrides,
  }
}

describe('BinderListClient', () => {
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
})
