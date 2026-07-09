/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CardPagination } from '../card-pagination'

describe('CardPagination', () => {
  it('totalPages <= 1 時不渲染', () => {
    const { container } = render(
      <CardPagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('第一頁時 Previous 為 disabled，點擊不觸發 onPageChange', () => {
    const onPageChange = vi.fn()
    render(<CardPagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)
    const prev = screen.getByLabelText('Go to previous page')
    expect(prev).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(prev)
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('最後一頁時 Next 為 disabled，點擊不觸發 onPageChange', () => {
    const onPageChange = vi.fn()
    render(<CardPagination currentPage={5} totalPages={5} onPageChange={onPageChange} />)
    const next = screen.getByLabelText('Go to next page')
    expect(next).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(next)
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('中間頁時 Previous/Next 皆可點並觸發 onPageChange', () => {
    const onPageChange = vi.fn()
    render(<CardPagination currentPage={3} totalPages={5} onPageChange={onPageChange} />)
    const prev = screen.getByLabelText('Go to previous page')
    const next = screen.getByLabelText('Go to next page')
    expect(prev).not.toHaveAttribute('aria-disabled', 'true')
    expect(next).not.toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(prev)
    expect(onPageChange).toHaveBeenCalledWith(2)

    fireEvent.click(next)
    expect(onPageChange).toHaveBeenCalledWith(4)
  })
})
