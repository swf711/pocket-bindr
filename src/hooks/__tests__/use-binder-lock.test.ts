/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { binderLockStorageKey, useBinderLock } from '../use-binder-lock'

describe('useBinderLock', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('預設未鎖定', () => {
    const { result } = renderHook(() => useBinderLock('b1'))
    expect(result.current.locked).toBe(false)
  })

  it('toggle 寫入 localStorage，重新掛載後仍保留', () => {
    const { result, unmount } = renderHook(() => useBinderLock('b1'))
    act(() => result.current.toggle())
    expect(result.current.locked).toBe(true)
    expect(window.localStorage.getItem(binderLockStorageKey('b1'))).toBe('1')
    unmount()

    const { result: again } = renderHook(() => useBinderLock('b1'))
    expect(again.current.locked).toBe(true)
    act(() => again.current.toggle())
    expect(again.current.locked).toBe(false)
    expect(window.localStorage.getItem(binderLockStorageKey('b1'))).toBeNull()
  })

  it('不同卡冊互不影響', () => {
    const { result: a } = renderHook(() => useBinderLock('a'))
    const { result: b } = renderHook(() => useBinderLock('b'))
    act(() => a.current.toggle())
    expect(a.current.locked).toBe(true)
    expect(b.current.locked).toBe(false)
  })

  it('localStorage 不可用時不崩潰，仍可在當頁鎖定', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
    const { result } = renderHook(() => useBinderLock('no-storage'))
    expect(result.current.locked).toBe(false)
    act(() => result.current.toggle())
    expect(result.current.locked).toBe(true)
  })
})
