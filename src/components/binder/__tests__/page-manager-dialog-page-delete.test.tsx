/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PageManagerDialog } from '../page-manager-dialog'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => {
  class MockResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  // jsdom 未實作 Pointer Capture API；Radix 對內部任何 pointerdown 皆呼叫
  // event.target.setPointerCapture()，需 stub 空實作（見 card-detail-drawer-nav.test.tsx 同一坑）。
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false)
  // jsdom 未實作 matchMedia；useHasNoHover 與 Radix 內部皆會用到。
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof PageManagerDialog>> = {},
) {
  const props: React.ComponentProps<typeof PageManagerDialog> = {
    binderId: 'binder-1',
    gridType: 'grid_3x3',
    totalPages: 2,
    slots: [],
    onPageDelete: vi.fn(),
    onPageReorder: vi.fn(),
    onTotalPagesChange: vi.fn(),
    onJumpToPage: vi.fn(),
    ...overrides,
  }
  return render(
    <TooltipProvider>
      <PageManagerDialog {...props} />
    </TooltipProvider>,
  )
}

async function openDialogAndConfirmDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('page-manager-btn'))
  await screen.findByTestId('page-manager-list')
  await user.click(screen.getByTestId('page-delete-btn-1'))
  await screen.findByTestId('page-delete-confirm-1')
}

describe('PageManagerDialog 內頁刪除確認 dialog', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('刪除成功後關閉確認 dialog', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ slots: [], totalPages: 1 }),
    } as Response)

    renderDialog()
    await openDialogAndConfirmDialog(user)

    await user.click(screen.getByTestId('page-delete-confirm-1'))

    await waitFor(() => expect(screen.queryByTestId('page-delete-confirm-1')).not.toBeInTheDocument())
  })

  it('刪除失敗（API 錯誤）時確認 dialog 維持開啟', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'failed' }),
    } as Response)

    renderDialog()
    await openDialogAndConfirmDialog(user)

    await user.click(screen.getByTestId('page-delete-confirm-1'))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    // dialog 仍在畫面上（未因失敗而被誤關閉）
    expect(screen.getByTestId('page-delete-confirm-1')).toBeInTheDocument()
  })

  it('點擊取消按鈕關閉 dialog 且不呼叫刪除 API', async () => {
    const user = userEvent.setup()
    renderDialog()
    await openDialogAndConfirmDialog(user)

    fireEvent.click(screen.getByText('取消'))

    await waitFor(() => expect(screen.queryByTestId('page-delete-confirm-1')).not.toBeInTheDocument())
    expect(fetch).not.toHaveBeenCalled()
  })
})
