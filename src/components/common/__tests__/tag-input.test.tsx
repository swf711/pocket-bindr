/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagInput } from '../tag-input'

/** 受控包裝：TagInput 本身無內部 value state，測試需自備。 */
function Harness({
  initial = [],
  max = 3,
  maxLength = 8,
  onChangeSpy,
  invalid,
  onDuplicate,
}: {
  initial?: string[]
  max?: number
  maxLength?: number
  onChangeSpy?: (v: string[]) => void
  invalid?: boolean
  onDuplicate?: (tag: string) => void
}) {
  const [value, setValue] = useState<string[]>(initial)
  return (
    <TagInput
      value={value}
      onChange={(v) => {
        setValue(v)
        onChangeSpy?.(v)
      }}
      max={max}
      maxLength={maxLength}
      inputTestId="tag-input"
      removeLabel={(tag) => `移除 ${tag}`}
      onDuplicate={onDuplicate}
      aria-invalid={invalid}
    />
  )
}

describe('TagInput', () => {
  it('按 Enter 將輸入內容變成一顆 chip 並清空輸入框', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByTestId('tag-input')
    await user.type(input, 'No.025{Enter}')
    expect(screen.getByTestId('tag-input-tag-No.025')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('前後空白會被 trim', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByTestId('tag-input'), '  SR  {Enter}')
    expect(screen.getByTestId('tag-input-tag-SR')).toBeInTheDocument()
  })

  it('重複的標籤不會新增第二顆，且通知呼叫端＋閃爍既有那顆', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    const onDuplicate = vi.fn()
    render(<Harness initial={['SR']} onChangeSpy={spy} onDuplicate={onDuplicate} />)
    await user.type(screen.getByTestId('tag-input'), 'SR{Enter}')
    expect(spy).not.toHaveBeenCalled()
    expect(screen.getAllByTestId(/^tag-input-tag-/)).toHaveLength(1)
    expect(onDuplicate).toHaveBeenCalledWith('SR')
    expect(screen.getByTestId('tag-input-tag-SR')).toHaveAttribute('data-duplicate', 'true')
  })

  it('逗號不再等同 Enter，只是一般字元', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Harness onChangeSpy={spy} />)
    const input = screen.getByTestId('tag-input')
    await user.type(input, 'a,b')
    expect(spy).not.toHaveBeenCalled()
    expect(input).toHaveValue('a,b')
  })

  // 注音／日文輸入法的第一次 Enter 是在確認候選字，不能當成建立 chip
  it('輸入法組字中的 Enter 不建立 chip', () => {
    const spy = vi.fn()
    render(<Harness onChangeSpy={spy} />)
    const input = screen.getByTestId('tag-input')
    fireEvent.change(input, { target: { value: '待換' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(spy).not.toHaveBeenCalled()
    expect(input).toHaveValue('待換')

    // 組字結束後再按一次才真的成為 chip
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(spy).toHaveBeenCalledWith(['待換'])
  })

  it('空白輸入按 Enter 不會產生 chip', async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Harness onChangeSpy={spy} />)
    await user.type(screen.getByTestId('tag-input'), '   {Enter}')
    expect(spy).not.toHaveBeenCalled()
  })

  it('達數量上限後輸入框 disabled', () => {
    render(<Harness initial={['a', 'b', 'c']} max={3} />)
    expect(screen.getByTestId('tag-input')).toBeDisabled()
  })

  it('× 可移除單一 chip', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['SR', 'RR']} />)
    await user.click(screen.getByTestId('tag-input-remove-SR'))
    expect(screen.queryByTestId('tag-input-tag-SR')).not.toBeInTheDocument()
    expect(screen.getByTestId('tag-input-tag-RR')).toBeInTheDocument()
  })

  it('輸入框為空時按 Backspace 刪掉最後一顆', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['SR', 'RR']} />)
    await user.click(screen.getByTestId('tag-input'))
    await user.keyboard('{Backspace}')
    expect(screen.getByTestId('tag-input-tag-SR')).toBeInTheDocument()
    expect(screen.queryByTestId('tag-input-tag-RR')).not.toBeInTheDocument()
  })

  it('輸入框有內容時 Backspace 只刪字、不刪 chip', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['SR']} />)
    const input = screen.getByTestId('tag-input')
    await user.type(input, 'ab{Backspace}')
    expect(input).toHaveValue('a')
    expect(screen.getByTestId('tag-input-tag-SR')).toBeInTheDocument()
  })

  it('失焦時自動收下尚未按 Enter 的殘留文字（避免靜默掉資料）', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByTestId('tag-input')
    await user.type(input, 'No.025')
    fireEvent.blur(input)
    expect(screen.getByTestId('tag-input-tag-No.025')).toBeInTheDocument()
  })

  it('maxLength 傳到 input，擋住超長輸入', () => {
    render(<Harness maxLength={8} />)
    expect(screen.getByTestId('tag-input')).toHaveAttribute('maxlength', '8')
  })

  it('chips 與輸入框同在一個 InputGroup 邊框內', () => {
    render(<Harness initial={['SR']} />)
    const inputGroup = screen.getByTestId('tag-input').closest('[data-slot="input-group"]')
    expect(inputGroup).not.toBeNull()
    expect(inputGroup).toContainElement(screen.getByTestId('tag-input-tag-SR'))
  })

  // InputGroup 的錯誤態邊框靠 has-[[data-slot][aria-invalid=true]] 選擇器，落錯層就不會亮
  it('aria-invalid 落在 input 元素上', () => {
    render(<Harness invalid />)
    expect(screen.getByTestId('tag-input')).toHaveAttribute('aria-invalid', 'true')
  })
})
