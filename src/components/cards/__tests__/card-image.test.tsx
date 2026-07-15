/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CardImage } from '../card-image'

function fallback() {
  return <div data-testid="fb">no image</div>
}

describe('CardImage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('src 為 null 直接落 fallback，reason=no-image，不 render <img>', () => {
    render(<CardImage src={null} alt="x" fallback={fallback()} />)
    const fb = screen.getByTestId('fb')
    expect(fb).toBeInTheDocument()
    expect(fb).toHaveAttribute('data-fallback-reason', 'no-image')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('首次 onError 後重試一次：src 不變、仍為 <img>、尚未落 fallback', () => {
    render(<CardImage src="/a.jpg" alt="x" fallback={fallback()} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/a.jpg')

    fireEvent.error(img)
    // 延遲 remount 前尚未切 fallback
    expect(screen.queryByTestId('fb')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(900)
    })
    // remount 後仍是 img、同一個 src、無 fallback
    const img2 = screen.getByRole('img')
    expect(img2).toHaveAttribute('src', '/a.jpg')
    expect(screen.queryByTestId('fb')).not.toBeInTheDocument()
  })

  it('重試後第二次 onError 落 fallback，reason=error', () => {
    render(<CardImage src="/a.jpg" alt="x" fallback={fallback()} />)
    fireEvent.error(screen.getByRole('img'))
    act(() => {
      vi.advanceTimersByTime(900)
    })
    fireEvent.error(screen.getByRole('img'))

    const fb = screen.getByTestId('fb')
    expect(fb).toHaveAttribute('data-fallback-reason', 'error')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('重試上限為 1（fallback 後不再有 img 可觸發第三次）', () => {
    render(<CardImage src="/a.jpg" alt="x" fallback={fallback()} />)
    fireEvent.error(screen.getByRole('img'))
    act(() => {
      vi.advanceTimersByTime(900)
    })
    fireEvent.error(screen.getByRole('img'))
    // 已落 fallback，無 img；即再 advance timer 也不會又冒出 img
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('fb')).toBeInTheDocument()
  })

  it('透傳 img 屬性（data-testid / className / draggable）', () => {
    render(
      <CardImage
        src="/a.jpg"
        alt="pikachu"
        data-testid="passthrough"
        className="object-cover"
        draggable={false}
      />,
    )
    const img = screen.getByTestId('passthrough')
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveClass('object-cover')
    expect(img).toHaveAttribute('draggable', 'false')
    expect(img).toHaveAttribute('alt', 'pikachu')
  })

  it('無 fallback 時，失敗後不 render 任何破圖 <img>', () => {
    render(<CardImage src="/a.jpg" alt="x" />)
    fireEvent.error(screen.getByRole('img'))
    act(() => {
      vi.advanceTimersByTime(900)
    })
    fireEvent.error(screen.getByRole('img'))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
