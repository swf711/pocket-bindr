/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsCarouselSection } from '../stats-carousel-section'
import type { ShowcaseCard } from '@/types/homepage'

vi.mock('@/components/cards/card-detail-drawer', () => ({
  CardDetailDrawer: () => null,
}))

vi.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CarouselContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CarouselItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const isMobileMock = vi.fn(() => false)
vi.mock('@/hooks/use-is-mobile', () => ({
  useIsMobile: () => isMobileMock(),
}))

beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve = vi.fn()
    }
  )
})

beforeEach(() => {
  isMobileMock.mockReturnValue(false)
})

function makeCard(id: string): ShowcaseCard {
  return {
    id,
    externalId: id,
    game: 'PTCG',
    language: 'EN',
    name: `Card ${id}`,
    imageSmall: `https://example.com/${id}.png`,
    imageLarge: `https://example.com/${id}_large.png`,
    supertype: 'Pokémon',
    rarity: null,
    hp: null,
    types: [],
    cardNumber: '001',
    isCollectible: true,
    canonicalCardId: null,
    attributes: null,
    canonicalCard: null,
    collectionStatus: { owned: 0, wanted: 0 },
    set: { id: 'set1', name: 'Set', series: 'S', externalId: 'sv1', releaseDate: null },
  }
}

const TWELVE_CARDS = Array.from({ length: 12 }, (_, i) => makeCard(`c${i}`))

describe('StatsCarouselSection', () => {
  it('totalCards 初始顯示 0（動畫前）', () => {
    render(<StatsCarouselSection totalCards={68000} carouselCards={TWELVE_CARDS} />)
    expect(screen.getByTestId('total-card-count')).toHaveTextContent('0')
  })

  it('totalCards 初始顯示 0（行動版，動畫前）', () => {
    isMobileMock.mockReturnValue(true)
    render(<StatsCarouselSection totalCards={68000} carouselCards={TWELVE_CARDS} />)
    expect(screen.getByTestId('total-card-count')).toHaveTextContent('0')
  })

  it('12 張 carouselCards 全部渲染', () => {
    render(<StatsCarouselSection totalCards={0} carouselCards={TWELVE_CARDS} />)
    const carouselCardEls = screen.getAllByTestId('carousel-card')
    expect(carouselCardEls).toHaveLength(12)
  })

  it('section 有 data-testid="stats-carousel-section"', () => {
    render(<StatsCarouselSection totalCards={0} carouselCards={TWELVE_CARDS} />)
    expect(screen.getByTestId('stats-carousel-section')).toBeInTheDocument()
  })

  it('空 carouselCards 不渲染 carousel-card', () => {
    render(<StatsCarouselSection totalCards={0} carouselCards={[]} />)
    expect(screen.queryAllByTestId('carousel-card')).toHaveLength(0)
  })

  it('桌面渲染 sticky parallax 外層（h-[300vh]）+ snap anchors', () => {
    render(<StatsCarouselSection totalCards={0} carouselCards={TWELVE_CARDS} />)
    const section = screen.getByTestId('stats-carousel-section')
    expect(section.tagName).toBe('SECTION')
    expect(section.className).toContain('h-[300vh]')
    // 兩個 snap anchor
    expect(section.querySelectorAll('.snap-start')).toHaveLength(2)
  })

  it('行動版渲染單一 snap section（文字在上 + carousel 在下）', () => {
    isMobileMock.mockReturnValue(true)
    render(<StatsCarouselSection totalCards={0} carouselCards={TWELVE_CARDS} />)
    const wrapper = screen.getByTestId('stats-carousel-section')
    expect(wrapper.tagName).toBe('DIV')
    // 單一 h-screen snap-start section
    expect(wrapper.querySelectorAll('section.snap-start')).toHaveLength(1)
    // 統計文字與 carousel 同在此 section 內
    expect(screen.getByTestId('total-card-count')).toBeInTheDocument()
    expect(screen.getAllByTestId('carousel-card')).toHaveLength(12)
  })
})
