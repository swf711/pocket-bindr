/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { mockSignIn, mockPush, mockRefresh } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
}))

vi.mock('next-auth/react', () => ({ signIn: mockSignIn }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush, refresh: mockRefresh }) }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { RegisterForm } from '../register-form'

function renderForm() {
  return render(<RegisterForm />)
}

describe('RegisterForm', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockPush.mockReset()
    mockRefresh.mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('渲染 email / username / password 三個欄位', () => {
    renderForm()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('使用者名稱')).toBeInTheDocument()
    expect(screen.getByLabelText('密碼')).toBeInTheDocument()
  })

  it('同時顯示 Google 與 Discord 社群登入按鈕', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Discord/i })).toBeInTheDocument()
  })

  it('Google 與 Discord 按鈕有 sr-only 無障礙文字', () => {
    renderForm()
    expect(screen.getByText('以 Google 登入')).toBeInTheDocument()
    expect(screen.getByText('以 Discord 登入')).toBeInTheDocument()
  })

  it('email 重複時顯示「此 Email 已被使用」', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ success: false, error: 'EMAIL_TAKEN' }),
    } as Response)
    renderForm()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taken@b.com' } })
    fireEvent.change(screen.getByLabelText('使用者名稱'), { target: { value: 'user1' } })
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: '註冊' }))
    await waitFor(() => {
      expect(screen.getByTestId('register-error')).toHaveTextContent('此 Email 已被使用')
    })
  })

  it('username 重複時顯示「此使用者名稱已被使用」', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ success: false, error: 'USERNAME_TAKEN' }),
    } as Response)
    renderForm()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@b.com' } })
    fireEvent.change(screen.getByLabelText('使用者名稱'), { target: { value: 'taken' } })
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: '註冊' }))
    await waitFor(() => {
      expect(screen.getByTestId('register-error')).toHaveTextContent('此使用者名稱已被使用')
    })
  })

  it('成功後呼叫 signIn 並導向 /cards', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    } as Response)
    mockSignIn.mockResolvedValue({ ok: true })
    renderForm()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@b.com' } })
    fireEvent.change(screen.getByLabelText('使用者名稱'), { target: { value: 'newuser' } })
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: '註冊' }))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', expect.objectContaining({ email: 'new@b.com' }))
      expect(mockPush).toHaveBeenCalledWith('/cards')
    })
  })

  it('點擊 Google 按鈕呼叫 signIn("google", { callbackUrl: "/cards" })', () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /Google/i }))
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/cards' })
  })

  it('點擊 Discord 按鈕呼叫 signIn("discord", { callbackUrl: "/cards" })', () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /Discord/i }))
    expect(mockSignIn).toHaveBeenCalledWith('discord', { callbackUrl: '/cards' })
  })
})
