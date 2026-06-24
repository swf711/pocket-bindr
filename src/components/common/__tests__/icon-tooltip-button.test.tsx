/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { IconTooltipButton } from '../icon-tooltip-button'

function renderWithProvider(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('IconTooltipButton', () => {
  it('以 tooltip 文字作為 aria-label，讓 icon-only 按鈕可讀', () => {
    renderWithProvider(<IconTooltipButton tooltip="下一頁">▶</IconTooltipButton>)
    expect(screen.getByRole('button', { name: '下一頁' })).toBeInTheDocument()
  })

  it('明確傳入 aria-label 時優先於 tooltip', () => {
    renderWithProvider(
      <IconTooltipButton tooltip="下一頁" aria-label="前往下一頁">
        ▶
      </IconTooltipButton>,
    )
    expect(screen.getByRole('button', { name: '前往下一頁' })).toBeInTheDocument()
  })

  it('轉發 onClick 與 disabled 等原生 Button props', () => {
    const onClick = vi.fn()
    renderWithProvider(
      <IconTooltipButton tooltip="刪除" onClick={onClick}>
        ✗
      </IconTooltipButton>,
    )
    fireEvent.click(screen.getByRole('button', { name: '刪除' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
