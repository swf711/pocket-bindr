/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { DialogHeaderClose } from '../dialog-header-close'

function renderDialog({
  description,
  onOpenChange,
}: { description?: React.ReactNode; onOpenChange?: (open: boolean) => void } = {}) {
  return render(
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeaderClose description={description}>
          <DialogTitle>標題文字</DialogTitle>
        </DialogHeaderClose>
      </DialogContent>
    </Dialog>,
  )
}

describe('DialogHeaderClose', () => {
  it('渲染傳入的 children（DialogTitle）於左側', () => {
    renderDialog()
    expect(screen.getByRole('heading', { name: '標題文字' })).toBeInTheDocument()
  })

  it('渲染帶 sr-only「關閉」文案的關閉按鈕', () => {
    renderDialog()
    expect(screen.getByRole('button', { name: '關閉' })).toBeInTheDocument()
  })

  it('提供 description 時渲染於 title row 下方', () => {
    renderDialog({ description: <p>說明文字</p> })
    expect(screen.getByText('說明文字')).toBeInTheDocument()
  })

  it('未提供 description 時不渲染', () => {
    renderDialog()
    expect(screen.queryByText('說明文字')).not.toBeInTheDocument()
  })

  it('點擊關閉鈕觸發 onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    renderDialog({ onOpenChange })
    fireEvent.click(screen.getByRole('button', { name: '關閉' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
