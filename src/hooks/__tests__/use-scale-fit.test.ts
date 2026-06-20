/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { computeScaleFit, useScaleFit } from '../use-scale-fit'

// ─── Pure function tests ───────────────────────────────────────────────────

describe('computeScaleFit', () => {
  it('outer 大於 natural size 時 scale 維持 1（不放大）', () => {
    const { scale, offsetX, offsetY } = computeScaleFit(1920, 1080, 916, 600)
    expect(scale).toBe(1)
    expect(offsetX).toBeGreaterThan(0) // centered
    expect(offsetY).toBeGreaterThan(0)
  })

  it('寬度是瓶頸：outerWidth < naturalWidth → 依寬度縮放', () => {
    // outerW/naturalW = 458/916 = 0.5; outerH/innerH = 1080/600 = 1.8 → width wins
    const { scale } = computeScaleFit(458, 1080, 916, 600)
    expect(scale).toBeCloseTo(0.5)
  })

  it('高度是瓶頸：outerHeight < innerHeight → 依高度縮放', () => {
    // outerW/naturalW = 916/916 = 1; outerH/innerH = 300/600 = 0.5 → height wins
    const { scale } = computeScaleFit(916, 300, 916, 600)
    expect(scale).toBeCloseTo(0.5)
  })

  it('offsetX 正確水平置中（高度限制時有水平空間）', () => {
    // scale=0.5（由高度決定）, naturalWidth*scale=458, outerW=916
    // offsetX = (916 - 458) / 2 = 229
    const { scale, offsetX, offsetY } = computeScaleFit(916, 300, 916, 600)
    expect(scale).toBeCloseTo(0.5)
    expect(offsetX).toBeCloseTo(229)
    expect(offsetY).toBe(0) // (300 - 600*0.5)/2 = 0
  })

  it('offsetY 正確垂直置中（寬度限制時有垂直空間）', () => {
    // scale=0.5（由寬度決定）, innerH*scale=300, outerH=800
    // offsetY = (800 - 300) / 2 = 250
    const { scale, offsetX, offsetY } = computeScaleFit(458, 800, 916, 600)
    expect(scale).toBeCloseTo(0.5)
    expect(offsetX).toBe(0) // (458 - 916*0.5)/2 = 0
    expect(offsetY).toBeCloseTo(250)
  })

  it('scale 精確等於 1 當 outer 剛好等於 natural size', () => {
    const { scale } = computeScaleFit(916, 600, 916, 600)
    expect(scale).toBe(1)
  })

  it('offset 永遠非負（outer 比 inner 小時 offset 為 0）', () => {
    const { offsetX, offsetY } = computeScaleFit(400, 200, 916, 600)
    expect(offsetX).toBeGreaterThanOrEqual(0)
    expect(offsetY).toBeGreaterThanOrEqual(0)
  })
})

// ─── Hook structural tests ─────────────────────────────────────────────────

let resizeCallbacks: Array<() => void> = []

beforeEach(() => {
  resizeCallbacks = []
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn().mockImplementation((cb: () => void) => {
      resizeCallbacks.push(cb)
      return { observe: vi.fn(), disconnect: vi.fn() }
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useScaleFit hook', () => {
  it('回傳初始 scale=1 且 offset 為 0', () => {
    const { result } = renderHook(() => useScaleFit(916))
    expect(result.current.scale).toBe(1)
    expect(result.current.offsetX).toBe(0)
    expect(result.current.offsetY).toBe(0)
  })

  it('outerRef 與 innerRef 為 ref object', () => {
    const { result } = renderHook(() => useScaleFit(916))
    expect('current' in result.current.outerRef).toBe(true)
    expect('current' in result.current.innerRef).toBe(true)
  })

  it('unmount 不 throw', () => {
    const { unmount } = renderHook(() => useScaleFit(916))
    expect(() => unmount()).not.toThrow()
  })
})
