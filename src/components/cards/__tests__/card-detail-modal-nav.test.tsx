/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock modules that have side effects or are not needed for navigation tests
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/components/auth/login-modal', () => ({
  LoginModal: () => null,
}))

// Mock fetch used inside AddToBinderSection (returns 401 = guest, so that section
// renders a simple "login" button — navigation buttons are outside that section).
global.fetch = vi.fn().mockResolvedValue({ status: 401, ok: false })

import { CardDetailModal } from '../card-detail-modal'
import { CardWithCollectionStatus } from '@/types/card'

function makeCard(id: string, name: string): CardWithCollectionStatus {
  return {
    id,
    name,
    imageSmall: '',
    imageLarge: '',
    rarity: null,
    hp: null,
    types: [],
    cardNumber: `00${id}`,
    collectionStatus: { owned: null, wanted: null },
    set: { id: 'set1', name: 'Test Set', series: 'Test Series' },
  }
}

const cardA = makeCard('1', 'Card A')
const cardB = makeCard('2', 'Card B')
const cardC = makeCard('3', 'Card C')
const cards = [cardA, cardB, cardC]

describe('CardDetailModal navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 401, ok: false })
  })

  function renderModal(currentIndex: number, onNavigate = vi.fn()) {
    return {
      onNavigate,
      ...render(
        <CardDetailModal
          card={cards[currentIndex]}
          open={true}
          onClose={vi.fn()}
          cards={cards}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
        />
      ),
    }
  }

  it('disables prev button when currentIndex === 0', () => {
    renderModal(0)
    const prevBtn = screen.getByTestId('modal-nav-prev')
    expect(prevBtn).toBeDisabled()
  })

  it('disables next button when currentIndex === cards.length - 1', () => {
    renderModal(2)
    const nextBtn = screen.getByTestId('modal-nav-next')
    expect(nextBtn).toBeDisabled()
  })

  it('calls onNavigate(currentIndex - 1) when prev clicked', async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderModal(1)
    await user.click(screen.getByTestId('modal-nav-prev'))
    expect(onNavigate).toHaveBeenCalledWith(0)
  })

  it('calls onNavigate(currentIndex + 1) when next clicked', async () => {
    const user = userEvent.setup()
    const { onNavigate } = renderModal(1)
    await user.click(screen.getByTestId('modal-nav-next'))
    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('calls onNavigate on ArrowLeft keydown', () => {
    const onNavigate = vi.fn()
    renderModal(1, onNavigate)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onNavigate).toHaveBeenCalledWith(0)
  })

  it('calls onNavigate on ArrowRight keydown', () => {
    const onNavigate = vi.fn()
    renderModal(1, onNavigate)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('does not call onNavigate on ArrowLeft when at index 0', () => {
    const onNavigate = vi.fn()
    renderModal(0, onNavigate)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('does not call onNavigate on ArrowRight when at last index', () => {
    const onNavigate = vi.fn()
    renderModal(2, onNavigate)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
