/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
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

function makeCard(id: string): ShowcaseCard {
  return {
    id,
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
})
