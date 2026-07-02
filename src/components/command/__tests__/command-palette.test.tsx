/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from '../command-palette'

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

let mockSession: { user: { id: string } } | null = null

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession }),
}))

const mockSetTheme = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: mockSetTheme }),
}))

vi.mock('@/i18n/locale-actions', () => ({
  setLocale: vi.fn().mockResolvedValue(undefined),
}))

function openPalette() {
  fireEvent.keyDown(window, { key: 'k', metaKey: true })
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession = null
    // cmdk 內部無條件呼叫 new ResizeObserver()，jsdom 無此 API，需手動 stub
    // （同 card-detail-drawer-nav.test.tsx 慣例）。
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn()
        disconnect = vi.fn()
        unobserve = vi.fn()
      },
    )
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('Cmd+K 開啟面板', () => {
    render(<CommandPalette />)
    openPalette()
    expect(screen.getByPlaceholderText('輸入指令或關鍵字…')).toBeInTheDocument()
  })

  it('未登入時隱藏受保護導航項與新增卡冊', () => {
    render(<CommandPalette />)
    openPalette()
    expect(screen.getByText('卡牌搜尋')).toBeInTheDocument()
    expect(screen.queryByText('我的卡冊')).not.toBeInTheDocument()
    expect(screen.queryByText('我的收藏')).not.toBeInTheDocument()
    expect(screen.queryByText('新增卡冊')).not.toBeInTheDocument()
  })

  it('登入時顯示受保護導航項與新增卡冊', () => {
    mockSession = { user: { id: 'u1' } }
    render(<CommandPalette />)
    openPalette()
    expect(screen.getByText('我的卡冊')).toBeInTheDocument()
    expect(screen.getByText('我的收藏')).toBeInTheDocument()
    expect(screen.getByText('新增卡冊')).toBeInTheDocument()
  })

  it('選取導航項會 push 對應 href 並關閉面板', () => {
    render(<CommandPalette />)
    openPalette()
    fireEvent.click(screen.getByText('卡牌搜尋'))
    expect(mockPush).toHaveBeenCalledWith('/cards')
    expect(screen.queryByPlaceholderText('輸入指令或關鍵字…')).not.toBeInTheDocument()
  })

  it('選取新增卡冊導向 /binders?new=1', () => {
    mockSession = { user: { id: 'u1' } }
    render(<CommandPalette />)
    openPalette()
    fireEvent.click(screen.getByText('新增卡冊'))
    expect(mockPush).toHaveBeenCalledWith('/binders?new=1')
  })

  it('選取切換主題會呼叫 setTheme 反轉', () => {
    render(<CommandPalette />)
    openPalette()
    fireEvent.click(screen.getByText('切換主題'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})
