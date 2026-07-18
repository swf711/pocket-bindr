/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import type { DragMoveEvent } from '@dnd-kit/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useEdgeHoverPageFlip } from '../use-edge-hover-page-flip'

function makeRightEdgeEvent(): DragMoveEvent {
  return {
    activatorEvent: new PointerEvent('pointermove', { clientX: 95 }),
    delta: { x: 0, y: 0 },
  } as unknown as DragMoveEvent
}

function makeContainerRef() {
  const container = document.createElement('div')
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    toJSON: () => ({}),
  })
  return { current: container }
}

describe('useEdgeHoverPageFlip', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('clears a pending edge-flip timer when the drag ends', () => {
    vi.useFakeTimers()
    const onSpreadChange = vi.fn()
    const { result } = renderHook(() => useEdgeHoverPageFlip({
      containerRef: makeContainerRef(),
      spreadIndex: 0,
      totalSpreads: 2,
      onSpreadChange,
      edgeWidth: 10,
      holdDuration: 600,
    }))

    act(() => result.current.handleDragMove(makeRightEdgeEvent()))
    act(() => result.current.handleDragEnd())
    act(() => vi.advanceTimersByTime(700))

    expect(onSpreadChange).not.toHaveBeenCalled()
  })

  it('clears a pending edge-flip timer when the view unmounts', () => {
    vi.useFakeTimers()
    const onSpreadChange = vi.fn()
    const containerRef = makeContainerRef()
    const { result, unmount } = renderHook(() => useEdgeHoverPageFlip({
      containerRef,
      spreadIndex: 0,
      totalSpreads: 2,
      onSpreadChange,
      edgeWidth: 10,
      holdDuration: 600,
    }))

    act(() => result.current.handleDragMove(makeRightEdgeEvent()))
    unmount()
    act(() => vi.advanceTimersByTime(700))

    expect(onSpreadChange).not.toHaveBeenCalled()
  })
})
