/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCardTilt } from '../use-card-tilt'

// Make rAF synchronous in jsdom
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function makePointerEvent(x: number, y: number): React.PointerEvent {
  return { clientX: x, clientY: y } as React.PointerEvent
}

function attachFakeRect(el: HTMLDivElement | null, rect: DOMRect) {
  if (!el) return
  el.getBoundingClientRect = () => rect
}

describe('useCardTilt', () => {
  it('初始狀態：transform 含 rotateX(0deg) rotateY(0deg)', () => {
    const { result } = renderHook(() => useCardTilt())
    expect(result.current.transformerStyle.transform).toContain('rotateX(0deg)')
    expect(result.current.transformerStyle.transform).toContain('rotateY(0deg)')
  })

  it('回傳 containerRef（ref object）', () => {
    const { result } = renderHook(() => useCardTilt())
    expect(result.current.containerRef).toBeDefined()
    expect('current' in result.current.containerRef).toBe(true)
  })

  it('handlers 包含 onPointerMove 與 onPointerLeave 函式', () => {
    const { result } = renderHook(() => useCardTilt())
    expect(typeof result.current.handlers.onPointerMove).toBe('function')
    expect(typeof result.current.handlers.onPointerLeave).toBe('function')
  })

  it('disabled:true 時 mousemove 不改變 transform', () => {
    const { result } = renderHook(() => useCardTilt({ disabled: true, maxRotateDeg: 15 }))
    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent(100, 0))
    })
    expect(result.current.transformerStyle.transform).toContain('rotateX(0deg)')
    expect(result.current.transformerStyle.transform).toContain('rotateY(0deg)')
  })

  it('mousemove 後 active：shine opacity 非 0', () => {
    const { result } = renderHook(() => useCardTilt({ maxRotateDeg: 15 }))

    // Attach fake element so getBoundingClientRect works
    const fakeEl = document.createElement('div')
    attachFakeRect(fakeEl, { left: 0, top: 0, width: 200, height: 300, right: 200, bottom: 300, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
    ;(result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = fakeEl

    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent(160, 60))
    })

    expect(result.current.shineStyle.opacity).toBe(1)
  })

  it('mouseleave 後：active 重置，shine opacity 為 0', () => {
    const { result } = renderHook(() => useCardTilt({ maxRotateDeg: 15 }))

    const fakeEl = document.createElement('div')
    attachFakeRect(fakeEl, { left: 0, top: 0, width: 200, height: 300, right: 200, bottom: 300, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
    ;(result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = fakeEl

    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent(160, 60))
    })
    act(() => {
      result.current.handlers.onPointerLeave()
    })

    expect(result.current.shineStyle.opacity).toBe(0)
    expect(result.current.transformerStyle.transform).toContain('rotateX(0deg)')
  })

  it('mousemove 後 transform 含非零 rotateY（mouse 偏右時）', () => {
    const { result } = renderHook(() => useCardTilt({ maxRotateDeg: 15 }))

    const fakeEl = document.createElement('div')
    // mouse at right edge → rx ≈ 1 → rotateY = (1-0.5)*2*15 = 15
    attachFakeRect(fakeEl, { left: 0, top: 0, width: 200, height: 300, right: 200, bottom: 300, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
    ;(result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = fakeEl

    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent(200, 150))
    })

    const transform = result.current.transformerStyle.transform as string
    // rotateY should be 15deg at right edge
    expect(transform).toContain('rotateY(15deg)')
  })

  it('maxRotateDeg 邊界：mouse 正中央時傾斜角為 0', () => {
    const { result } = renderHook(() => useCardTilt({ maxRotateDeg: 15 }))

    const fakeEl = document.createElement('div')
    attachFakeRect(fakeEl, { left: 0, top: 0, width: 200, height: 300, right: 200, bottom: 300, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
    ;(result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = fakeEl

    act(() => {
      result.current.handlers.onPointerMove(makePointerEvent(100, 150))
    })

    expect(result.current.transformerStyle.transform).toContain('rotateX(0deg)')
    expect(result.current.transformerStyle.transform).toContain('rotateY(0deg)')
  })

  it('unmount 不 throw（rAF cleanup）', () => {
    const { unmount } = renderHook(() => useCardTilt())
    expect(() => unmount()).not.toThrow()
  })
})
