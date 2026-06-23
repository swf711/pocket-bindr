/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import React from 'react'
import { useStickyScrollProgress } from '../use-sticky-scroll-progress'

// jsdom 不計算 layout：以 Object.defineProperty 注入尺寸，rAF 同步執行
function setOffsetHeight(el: HTMLElement, value: number) {
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => value })
}

function setRectTop(el: HTMLElement, top: number) {
  el.getBoundingClientRect = () =>
    ({ top, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: top, toJSON: () => {} }) as DOMRect
}

function setViewportH(value: number) {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value })
}

function Harness() {
  const { outerRef, progress } = useStickyScrollProgress<HTMLDivElement>()
  // 將 progress 渲染進 DOM（純渲染，避免改 module-scope 變數觸發 react-hooks/globals）
  return React.createElement('div', {
    ref: outerRef,
    'data-testid': 'outer',
    'data-progress': progress,
  })
}

function readProgress(outer: HTMLElement) {
  return Number(outer.getAttribute('data-progress'))
}

beforeEach(() => {
  setViewportH(1000)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// progress = clamp(-outerRect.top / (offsetHeight - innerHeight), 0, 1)
function setup(dims: { outerH: number; rectTop: number }) {
  const utils = render(React.createElement(Harness))
  const outer = utils.getByTestId('outer')
  setOffsetHeight(outer, dims.outerH)
  setRectTop(outer, dims.rectTop)
  return { ...utils, outer }
}

describe('useStickyScrollProgress', () => {
  it('初始 progress 為 0', () => {
    const { getByTestId } = render(React.createElement(Harness))
    expect(readProgress(getByTestId('outer'))).toBe(0)
  })

  it('捲動至中段回傳介於 0~1 的 progress', () => {
    // travel = 2000 - 1000 = 1000；-rectTop = 500 → 0.5
    const { outer } = setup({ outerH: 2000, rectTop: -500 })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(readProgress(outer)).toBeCloseTo(0.5)
  })

  it('捲動超過 travel 夾擠為 1', () => {
    const { outer } = setup({ outerH: 2000, rectTop: -5000 })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(readProgress(outer)).toBe(1)
  })

  it('往上（rectTop 為正）夾擠為 0', () => {
    const { outer } = setup({ outerH: 2000, rectTop: 800 })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(readProgress(outer)).toBe(0)
  })

  it('travel <= 0（內容比 viewport 矮）回傳 0', () => {
    const { outer } = setup({ outerH: 500, rectTop: -200 })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(readProgress(outer)).toBe(0)
  })

  it('unmount 後移除 window scroll listener', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const utils = render(React.createElement(Harness))
    utils.unmount()
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { capture: true })
  })
})
