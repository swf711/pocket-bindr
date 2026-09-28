/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CardItem } from '../card-item'
import type { CardWithCollectionStatus } from '@/types/card'

const prefetch = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ prefetch }) }))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))

// viewport prefetch 是否真的關閉，只能靠 <Link> 收到的 prop 判斷，故在此攤平成 <a data-prefetch>。
vi.mock('next/link', () => ({
  default: ({ children, prefetch, ...props }: React.ComponentProps<'a'> & { prefetch?: boolean }) => (
    <a {...props} data-prefetch={String(prefetch)}>{children}</a>
  ),
}))

const card = {
  id: 'c1',
  name: 'Pikachu',
  cardNumber: '25/102',
  imageSmall: 'https://example.test/p.jpg',
  isCollectible: true,
  canonicalCard: null,
} as unknown as CardWithCollectionStatus

describe('CardItem 的 prefetch 策略', () => {
  beforeEach(() => prefetch.mockClear())

  // 🔴 格線一次帶入數十張卡，viewport prefetch 會對每張都打一次攔截 modal 路由——實測為
  // Active CPU 最大宗。這條斷言是防止有人日後把 prefetch 拿掉而讓成本悄悄回來。
  it('搜尋頁的卡片連結關閉 viewport prefetch', () => {
    render(<CardItem card={card} onClick={vi.fn()} href="/cards/ptcg/en/xy10-3" />)
    expect(screen.getByTestId('card-item')).toHaveAttribute('data-prefetch', 'false')
  })

  it('滑鼠移入時才手動預抓，維持桌面 hover→click 的零延遲手感', () => {
    render(<CardItem card={card} onClick={vi.fn()} href="/cards/ptcg/en/xy10-3" />)
    expect(prefetch).not.toHaveBeenCalled()
    fireEvent.mouseEnter(screen.getByTestId('card-item'))
    expect(prefetch).toHaveBeenCalledWith('/cards/ptcg/en/xy10-3')
  })

  it('多選模式不預抓（點擊是勾選，不會導航）', () => {
    render(
      <CardItem card={card} onClick={vi.fn()} href="/cards/ptcg/en/xy10-3" selectable onToggleSelect={vi.fn()} />,
    )
    fireEvent.mouseEnter(screen.getByTestId('card-item'))
    expect(prefetch).not.toHaveBeenCalled()
  })
})
