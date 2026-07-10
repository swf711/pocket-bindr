/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

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

/** 填妥所有必填欄位（密碼預設合法、確認一致） */
function fillForm({
  email = 'new@b.com',
  username = 'newuser',
  password = 'password123',
  confirm = password,
}: { email?: string; username?: string; password?: string; confirm?: string } = {}) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('使用者名稱'), { target: { value: username } })
  fireEvent.change(screen.getByLabelText('密碼'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('確認密碼'), { target: { value: confirm } })
}

describe('RegisterForm', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockPush.mockReset()
    mockRefresh.mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('渲染 email / username / password / 確認密碼 欄位', () => {
    renderForm()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('使用者名稱')).toBeInTheDocument()
    expect(screen.getByLabelText('密碼')).toBeInTheDocument()
    expect(screen.getByLabelText('確認密碼')).toBeInTheDocument()
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

  it('輸入密碼時顯示強度提示', () => {
    renderForm()
    expect(screen.queryByTestId('password-strength')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'Password1' } })
    expect(screen.getByTestId('password-strength')).toHaveTextContent('強')
  })

  it('密碼過短時顯示錯誤且不送出 fetch', async () => {
    renderForm()
    fillForm({ password: 'short', confirm: 'short' })
    fireEvent.click(screen.getByRole('button', { name: '註冊' }))
    await waitFor(() => {
      // inline 顯示於密碼欄位
      expect(screen.getByText('密碼至少需要 8 個字元')).toBeInTheDocument()
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('兩次密碼不一致時顯示錯誤且不送出 fetch', async () => {
    renderForm()
    fillForm({ password: 'password123', confirm: 'password999' })
    fireEvent.click(screen.getByRole('button', { name: '註冊' }))
    await waitFor(() => {
      // inline 顯示於確認密碼欄位
      expect(screen.getByText('兩次輸入的密碼不一致')).toBeInTheDocument()
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('email 重複時顯示「此 Email 已被使用」', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ success: false, error: 'EMAIL_TAKEN' }),
    } as Response)
    renderForm()
    fillForm({ email: 'taken@b.com', username: 'user1' })
    fireEvent.click(screen.getByRole('button', { name: '註冊' }))
    await waitFor(() => {
      // 可歸欄位 → inline 貼回 email 欄位
      expect(screen.getByText('此 Email 已被使用')).toBeInTheDocument()
    })
  })

  it('username 重複時顯示「此使用者名稱已被使用」', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ success: false, error: 'USERNAME_TAKEN' }),
    } as Response)
    renderForm()
    fillForm({ username: 'taken' })
    fireEvent.click(screen.getByRole('button', { name: '註冊' }))
    await waitFor(() => {
      // 可歸欄位 → inline 貼回 username 欄位
      expect(screen.getByText('此使用者名稱已被使用')).toBeInTheDocument()
    })
  })

  it('成功後顯示「請查收信箱」狀態，不自動 signIn（強制 email 驗證）', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    } as Response)
    renderForm()
    fillForm({ email: 'new@b.com' })
    fireEvent.click(screen.getByRole('button', { name: '註冊' }))
    await waitFor(() => {
      expect(screen.getByText('請查收信箱')).toBeInTheDocument()
      expect(screen.getByText(/new@b\.com/)).toBeInTheDocument()
    })
    expect(mockSignIn).not.toHaveBeenCalledWith('credentials', expect.anything())
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('拋棄式信箱網域回傳 DISPOSABLE_EMAIL 時顯示於 email 欄位（D7）', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ success: false, error: 'DISPOSABLE_EMAIL' }),
    } as Response)
    renderForm()
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: '註冊' }))
    await waitFor(() => {
      expect(screen.getByText('不支援使用拋棄式信箱註冊')).toBeInTheDocument()
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

  it('點擊 consent 的「服務條款」原地開啟 Dialog 顯示條款內容', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: '服務條款' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: '準據法與管轄' })).toBeInTheDocument()
  })

  it('點擊 consent 的「隱私權政策」原地開啟 Dialog 顯示隱私內容', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: '隱私權政策' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: '我們蒐集的個人資料' })).toBeInTheDocument()
  })

  it('法律 Dialog 以底部「關閉」鍵關閉、無右上角 X', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: '服務條款' }))
    const dialog = await screen.findByRole('dialog')
    // 無 shadcn 預設右上角 X（sr-only 文字為 "Close"）
    expect(within(dialog).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    const closeBtn = within(dialog).getByRole('button', { name: '關閉' })
    fireEvent.click(closeBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
