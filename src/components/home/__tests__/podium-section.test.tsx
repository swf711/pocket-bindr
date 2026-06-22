/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PodiumSection } from '../podium-section'
import type { WantedRankCard } from '@/types/homepage'

function makeCard(cardId: string, name: string, wantedCount: number): WantedRankCard {
  return {
    cardId,
    name,
    imageSmall: `https://example.com/${cardId}.png`,
    rarity: 'Rare',
    setName: 'Test Set',
    wantedCount,
  }
}

const THREE_CARDS = [
  makeCard('c1', 'Charizard ex', 50),
  makeCard('c2', 'Pikachu', 30),
  makeCard('c3', 'Mewtwo', 20),
]

const defaultProps = {
  ptcgWanted: THREE_CARDS,
  opcgWanted: [],
  selectedGame: 'PTCG' as const,
  onGameChange: vi.fn(),
}

describe('PodiumSection', () => {
  it('只顯示前三名（3 個 podium-card）', () => {
    render(<PodiumSection {...defaultProps} />)
    const podiumCards = screen.getAllByTestId('podium-card')
    expect(podiumCards).toHaveLength(3)
  })

  it('空資料時顯示 fallback 文字', () => {
    render(<PodiumSection {...defaultProps} ptcgWanted={[]} />)
    expect(screen.getByText('目前尚無想要資料')).toBeInTheDocument()
    expect(screen.queryAllByTestId('podium-card')).toHaveLength(0)
  })

  it('切換 game tab 呼叫 onGameChange', async () => {
    const user = userEvent.setup()
    const onGameChange = vi.fn()
    render(<PodiumSection {...defaultProps} onGameChange={onGameChange} />)
    await user.click(screen.getByRole('tab', { name: 'One Piece' }))
    expect(onGameChange).toHaveBeenCalledWith('OPCG')
  })

  it('選擇 OPCG 時顯示 OPCG 卡牌', () => {
    const opcgCards = [makeCard('op1', 'ルフィ', 99)]
    render(
      <PodiumSection
        {...defaultProps}
        selectedGame="OPCG"
        opcgWanted={opcgCards}
      />
    )
    expect(screen.getByAltText('ルフィ')).toBeInTheDocument()
  })

  it('有「即將推出：分享你的卡冊」預告文字', () => {
    render(<PodiumSection {...defaultProps} />)
    expect(screen.getByText(/即將推出：分享你的卡冊/)).toBeInTheDocument()
  })

  it('section 有 data-testid="podium-section"', () => {
    render(<PodiumSection {...defaultProps} />)
    expect(screen.getByTestId('podium-section')).toBeInTheDocument()
  })
})
