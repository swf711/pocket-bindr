/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHasNoHover } from '../use-has-hover'

type MqlListener = (e: { matches: boolean }) => void

function makeMql(matches: boolean) {
  const listeners: MqlListener[] = []
  const mql = {
    matches,
    addEventListener: vi.fn((_event: string, cb: MqlListener) => listeners.push(cb)),
    removeEventListener: vi.fn((_event: string, cb: MqlListener) => {
      const idx = listeners.indexOf(cb)
      if (idx !== -1) listeners.splice(idx, 1)
    }),
    // update matches so onChange (which reads mql.matches) sees the new value
    _trigger: (newMatches: boolean) => {
      mql.matches = newMatches
      listeners.forEach((cb) => cb({ matches: newMatches }))
    },
  }
  return mql
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useHasNoHover', () => {
  it('(hover: hover) 桌面裝置時回傳 false', () => {
    const mql = makeMql(false)
    vi.stubGlobal('matchMedia', vi.fn(() => mql))

    const { result } = renderHook(() => useHasNoHover())
    expect(result.current).toBe(false)
  })

  it('(hover: none) 觸控裝置（iPad/手機）時回傳 true', () => {
    const mql = makeMql(true)
    vi.stubGlobal('matchMedia', vi.fn(() => mql))

    const { result } = renderHook(() => useHasNoHover())
    expect(result.current).toBe(true)
  })

  it('MQL change 事件觸發時更新狀態', () => {
    const mql = makeMql(false)
    vi.stubGlobal('matchMedia', vi.fn(() => mql))

    const { result } = renderHook(() => useHasNoHover())
    expect(result.current).toBe(false)

    act(() => { mql._trigger(true) })
    expect(result.current).toBe(true)

    act(() => { mql._trigger(false) })
    expect(result.current).toBe(false)
  })

  it('unmount 時移除事件監聽器', () => {
    const mql = makeMql(false)
    vi.stubGlobal('matchMedia', vi.fn(() => mql))

    const { unmount } = renderHook(() => useHasNoHover())
    expect(mql.addEventListener).toHaveBeenCalledTimes(1)

    unmount()
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1)
  })

  it('matchMedia 不支援時（typeof !== function）不 crash，回傳 false', () => {
    vi.stubGlobal('matchMedia', undefined)

    const { result } = renderHook(() => useHasNoHover())
    expect(result.current).toBe(false)
  })
})
