/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { PasswordInput } from '../password-input'

describe('PasswordInput', () => {
  it('預設為 password 類型，並顯示「顯示密碼」toggle 按鈕', () => {
    render(<PasswordInput aria-label="pw" />)
    expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: '顯示密碼' })).toBeInTheDocument()
  })

  it('點擊眼睛按鈕切換為 text，再點一次切回 password', () => {
    render(<PasswordInput aria-label="pw" />)
    fireEvent.click(screen.getByRole('button', { name: '顯示密碼' }))
    expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'text')
    const hideBtn = screen.getByRole('button', { name: '隱藏密碼' })
    expect(hideBtn).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(hideBtn)
    expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'password')
  })

  it('透傳 id 等原生 props 至底層 input', () => {
    render(<PasswordInput id="my-pw" data-testid="pw-field" />)
    const input = screen.getByTestId('pw-field')
    expect(input).toHaveAttribute('id', 'my-pw')
  })
})
