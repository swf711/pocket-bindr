/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResponsivePopover } from '../responsive-popover'

const isMobileMock = vi.fn(() => false)
vi.mock('@/hooks/use-is-mobile', () => ({
  useIsMobile: () => isMobileMock(),
}))

beforeEach(() => {
  isMobileMock.mockReturnValue(false)
})

function Harness({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ResponsivePopover
      open={open}
      onOpenChange={onOpenChange}
      title="搜尋系列"
      trigger={<button type="button">開啟</button>}
    >
      <div>內容區塊</div>
    </ResponsivePopover>
  )
}

describe('ResponsivePopover', () => {
  it('桌面（useIsMobile=false）：open 時渲染 Popover 內容，trigger 存在', () => {
    isMobileMock.mockReturnValue(false)
    render(<Harness open onOpenChange={() => {}} />)
    expect(screen.getByText('開啟')).toBeInTheDocument()
    expect(screen.getByText('內容區塊')).toBeInTheDocument()
  })

  it('行動（useIsMobile=true）：open 時渲染 Drawer（role="dialog"）並含 DrawerTitle=title', () => {
    isMobileMock.mockReturnValue(true)
    render(<Harness open onOpenChange={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('搜尋系列')).toBeInTheDocument()
    expect(screen.getByText('內容區塊')).toBeInTheDocument()
  })

  it('行動變體含視覺隱藏的 title 供螢幕閱讀器（sr-only）', () => {
    isMobileMock.mockReturnValue(true)
    render(<Harness open onOpenChange={() => {}} />)
    const title = screen.getByText('搜尋系列')
    expect(title.closest('.sr-only')).not.toBeNull()
  })

  it('點擊 trigger 觸發 onOpenChange(true)', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    isMobileMock.mockReturnValue(false)
    render(<Harness open={false} onOpenChange={onOpenChange} />)
    await user.click(screen.getByText('開啟'))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})
