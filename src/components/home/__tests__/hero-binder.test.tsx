/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { createElement } from 'react'
import { beforeAll, beforeEach, describe, it, expect, vi } from 'vitest'

// 包裝（非取代）DndContext 以攔截其 handler props，讓 jsdom 下也能觸發取消拖曳。
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>()
  const { captureDndHandlers } = await import('../../__tests__/helpers/dnd-capture')
  return {
    ...actual,
    DndContext: (props: React.ComponentProps<typeof actual.DndContext>) => {
      captureDndHandlers(props)
      return createElement(actual.DndContext, props)
    },
  }
})

function setupMatchMedia(desktopMatches: boolean, reducedMotionMatches = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('min-width') ? desktopMatches : reducedMotionMatches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  })
}

beforeAll(() => {
  setupMatchMedia(false)
})

beforeEach(() => {
  vi.restoreAllMocks()
  setupMatchMedia(false)
  resetCapturedDndHandlers()
})

import { render, screen, act } from '@testing-library/react'
import { HeroBinder } from '../hero-binder'
import {
  fireDragCancel,
  fireDragStart,
  resetCapturedDndHandlers,
} from '../../__tests__/helpers/dnd-capture'
import type { ShowcaseCard } from '@/types/homepage'

function makeCard(id: string, name: string): ShowcaseCard {
  return {
    id,
    externalId: id,
    game: 'PTCG',
    language: 'EN',
    name,
    imageSmall: `https://example.com/${id}.png`,
    imageLarge: `https://example.com/${id}_large.png`,
    supertype: 'Pokémon',
    rarity: 'Rare',
    hp: 100,
    types: ['Fire'],
    cardNumber: '001',
    isCollectible: true,
    canonicalCardId: null,
    attributes: null,
    canonicalCard: null,
    collectionStatus: { owned: 0, wanted: 0 },
    set: { id: 'set1', name: 'Test Set', series: 'Test', externalId: 'sv1', releaseDate: null },
  }
}

const NINE_CARDS = Array.from({ length: 9 }, (_, i) => makeCard(`card-${i}`, `Card ${i}`))

describe('HeroBinder', () => {
  it('正確渲染 9 張卡牌', () => {
    render(<HeroBinder cards={NINE_CARDS} />)
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(9)
  })

  it('初始順序與 props.cards 一致', () => {
    render(<HeroBinder cards={NINE_CARDS} />)
    const images = screen.getAllByRole('img')
    images.forEach((img, i) => {
      expect(img).toHaveAttribute('alt', `Card ${i}`)
    })
  })

  it('根元素有 data-testid="hero-binder"', () => {
    render(<HeroBinder cards={NINE_CARDS} />)
    expect(screen.getByTestId('hero-binder')).toBeInTheDocument()
  })

  it('每張卡有對應 data-testid', () => {
    render(<HeroBinder cards={NINE_CARDS} />)
    for (let i = 0; i < 9; i++) {
      expect(screen.getByTestId(`hero-binder-card-${i}`)).toBeInTheDocument()
    }
  })

  it('渲染拖拉提示文字', () => {
    render(<HeroBinder cards={NINE_CARDS} />)
    expect(screen.getByText('拖拉卡牌來重新排列')).toBeInTheDocument()
  })
})

describe('HeroBinder parallax', () => {
  it('parallax wrapper 是最外層 div，有 willChange: transform 樣式', () => {
    const { container } = render(<HeroBinder cards={NINE_CARDS} />)
    const parallaxWrapper = container.firstElementChild as HTMLElement
    expect(parallaxWrapper).toHaveStyle({ willChange: 'transform' })
  })

  it('桌面 + 無 reduced-motion：掛載後 scroll 監聽器已附加', async () => {
    setupMatchMedia(true, false)
    const addSpy = vi.spyOn(window, 'addEventListener')

    await act(async () => {
      render(<HeroBinder cards={NINE_CARDS} />)
    })

    const scrollCalls = addSpy.mock.calls.filter(([event]) => event === 'scroll')
    expect(scrollCalls.length).toBeGreaterThan(0)
  })

  it('prefers-reduced-motion：scroll 監聽器不附加', async () => {
    setupMatchMedia(true, true)
    const addSpy = vi.spyOn(window, 'addEventListener')

    await act(async () => {
      render(<HeroBinder cards={NINE_CARDS} />)
    })

    const scrollCalls = addSpy.mock.calls.filter(([event]) => event === 'scroll')
    expect(scrollCalls.length).toBe(0)
  })

  it('行動裝置（isDesktop=false）：scroll 監聽器不附加', async () => {
    setupMatchMedia(false, false)
    const addSpy = vi.spyOn(window, 'addEventListener')

    await act(async () => {
      render(<HeroBinder cards={NINE_CARDS} />)
    })

    const scrollCalls = addSpy.mock.calls.filter(([event]) => event === 'scroll')
    expect(scrollCalls.length).toBe(0)
  })

  it('unmount 後 scroll 監聽器被移除', async () => {
    setupMatchMedia(true, false)
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    let unmount!: () => void
    await act(async () => {
      const result = render(<HeroBinder cards={NINE_CARDS} />)
      unmount = result.unmount
    })

    await act(async () => { unmount() })

    const scrollRemovals = removeSpy.mock.calls.filter(([event]) => event === 'scroll')
    expect(scrollRemovals.length).toBeGreaterThan(0)
  })
})

describe('HeroBinder 取消拖曳（onDragCancel）', () => {
  const IDLE_TILT = 'rotateX(5deg) rotateY(-15deg) rotateZ(10deg)'

  function renderDesktop() {
    setupMatchMedia(true, true) // 桌面且 reduced-motion，避開 parallax 的 rAF 雜訊
    const { container } = render(<HeroBinder cards={NINE_CARDS} />)
    // 最外層 parallax > perspective > tilt wrapper
    const tilt = container.firstElementChild!.firstElementChild!
      .firstElementChild as HTMLElement
    return { tilt }
  }

  it('拖曳開始時攤平（transform: none）', async () => {
    const { tilt } = renderDesktop()
    expect(tilt.style.transform).toBe(IDLE_TILT)

    await act(async () => { fireDragStart('hero-binder-dnd', 'card-0') })
    expect(tilt.style.transform).toBe('none')
  })

  it('拖曳被取消（Esc）後恢復傾斜，不會卡在攤平狀態', async () => {
    const { tilt } = renderDesktop()

    await act(async () => { fireDragStart('hero-binder-dnd', 'card-0') })
    expect(tilt.style.transform).toBe('none')

    await act(async () => { fireDragCancel('hero-binder-dnd', 'card-0') })
    expect(tilt.style.transform).toBe(IDLE_TILT)
  })

  it('取消拖曳不改變卡牌順序', async () => {
    renderDesktop()

    await act(async () => { fireDragStart('hero-binder-dnd', 'card-0') })
    await act(async () => { fireDragCancel('hero-binder-dnd', 'card-0') })

    screen.getAllByRole('img').forEach((img, i) => {
      expect(img).toHaveAttribute('alt', `Card ${i}`)
    })
  })
})
