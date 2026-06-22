/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroBinder } from '../hero-binder'
import type { ShowcaseCard } from '@/types/homepage'

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...actual,
    DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

function makeCard(id: string, name: string): ShowcaseCard {
  return {
    id,
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
})
