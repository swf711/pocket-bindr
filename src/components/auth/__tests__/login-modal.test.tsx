/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

const { mockSignIn, mockRefresh } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('next-auth/react', () => ({ signIn: mockSignIn }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

import { LoginModal } from '../login-modal'

function renderModal(props?: Partial<Parameters<typeof LoginModal>[0]>) {
  return render(
    <LoginModal
      isOpen={true}
      onClose={vi.fn()}
      onSuccess={vi.fn()}
      {...props}
    />,
  )
}

describe('LoginModal', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockRefresh.mockReset()
  })

  it('顯示 Email 與密碼 FieldLabel', () => {
    renderModal()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('密碼')).toBeInTheDocument()
  })

  it('同時顯示 Google 與 Discord 社群登入按鈕', () => {
    renderModal()
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Discord/i })).toBeInTheDocument()
  })

  it('Google 與 Discord 按鈕有 sr-only 無障礙文字', () => {
    renderModal()
    expect(screen.getByText('以 Google 登入')).toBeInTheDocument()
    expect(screen.getByText('以 Discord 登入')).toBeInTheDocument()
  })

  it('提交失敗時顯示錯誤訊息', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' })
    renderModal()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '登入' }))
    await waitFor(() => {
      expect(screen.getByText('登入失敗，請確認帳號密碼')).toBeInTheDocument()
    })
  })

  it('登入成功後呼叫 router.refresh 與 onSuccess', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    const onSuccess = vi.fn()
    renderModal({ onSuccess })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: '登入' }))
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('點擊 Google 按鈕呼叫 signIn("google")', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /Google/i }))
    expect(mockSignIn).toHaveBeenCalledWith('google')
  })

  it('點擊 Discord 按鈕呼叫 signIn("discord")', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /Discord/i }))
    expect(mockSignIn).toHaveBeenCalledWith('discord')
  })

  it('點擊 consent 的「服務條款」在 modal 內開啟巢狀 Dialog 顯示條款內容', async () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: '服務條款' }))
    const dialog = await screen.findByRole('dialog', { name: '服務條款' })
    expect(within(dialog).getByRole('heading', { name: '準據法與管轄' })).toBeInTheDocument()
  })
})
