'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

/** 重複標籤時既有 chip 的閃爍時間（ms）。夠久到看得見，短到不擋下一次輸入。 */
const FLASH_DURATION = 1200

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  /** 標籤數量上限；達上限後輸入框 disabled */
  max: number
  /** 單一標籤字數上限 */
  maxLength: number
  placeholder?: string
  /** 移除鈕的 aria-label（i18n 由呼叫端提供，本元件保持與 next-intl 無關） */
  removeLabel: (tag: string) => string
  /** 使用者輸入了已存在的標籤時通知呼叫端（顯示提示文案）；本元件同時會閃爍該顆既有 chip */
  onDuplicate?: (tag: string) => void
  id?: string
  inputTestId?: string
  'aria-invalid'?: boolean
  className?: string
}

/**
 * Chip 式多值輸入：打字後按 Enter 成為一顆 chip，chip 可個別移除。
 *
 * 外觀以既有的 shadcn `ui/input-group` 組出（chips 收在同一個邊框內、輸入框在下方），
 * 等同 shadcn `ComboboxChips` 的形態但**零新依賴**——shadcn 的 Combobox 建在 `@base-ui/react`，
 * Radix Primitives 沒有 combobox 這個 primitive（官方的「Radix 版」文件實際上也是裝 Base UI），
 * 而我們用不到它的核心價值（過濾選單），不值得為此引入第二套 headless 函式庫。
 * focus ring／錯誤態邊框／點空白處 focus 輸入框（且已排除 button，故點 × 不誤觸）皆由 InputGroup 提供。
 *
 * 🔴 Enter 必須 preventDefault，否則會直接送出外層 form。
 * 🔴 **輸入法組字中的 Enter 不可視為送出**（`isComposing`）——注音／日文輸入法的第一次 Enter
 * 是在確認候選字，不檢查的話「待換」打到一半就會被切成 chip。英數字輸入完全踩不到，
 * 所以自動化測試不會發現，必須靠這道 guard。
 * 🔴 失焦時自動收下尚未按 Enter 的殘留文字——否則使用者打完字直接按「儲存」會靜默掉資料
 * （chip input 最常見的陷阱）。按鈕的 mousedown 會先觸發 input blur，故送出時值已是最新。
 */
export function TagInput({
  value,
  onChange,
  max,
  maxLength,
  placeholder,
  removeLabel,
  onDuplicate,
  id,
  inputTestId,
  'aria-invalid': ariaInvalid,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState('')
  const [flashTag, setFlashTag] = useState<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFull = value.length >= max

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current)
  }, [])

  const flashDuplicate = (tag: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current)
    setFlashTag(tag)
    flashTimer.current = setTimeout(() => setFlashTag(null), FLASH_DURATION)
    onDuplicate?.(tag)
  }

  const commit = () => {
    const next = draft.trim()
    setDraft('')
    if (!next || isFull) return
    // 重複不是靜默丟棄：閃一下既有的那顆並通知呼叫端顯示提示
    if (value.includes(next)) {
      flashDuplicate(next)
      return
    }
    onChange([...value, next])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 輸入法組字中（注音／日文候選字）的按鍵一律不攔截
    if (e.nativeEvent.isComposing) return

    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
      return
    }
    // 輸入框已空時的 Backspace 視為「刪掉最後一顆」
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault()
      onChange(value.slice(0, -1))
    }
  }

  return (
    <InputGroup className={cn('h-auto', className)}>
      {value.length > 0 && (
        <InputGroupAddon align="block-start" className="flex-wrap gap-1" data-testid="tag-input-tags">
          {value.map((tag) => (
            <Badge
              key={tag}
              // tertiary 系（專案既有的刻意強調色，同 card-detail-drawer 的稀有度／HP badge）：
              // secondary 的底色與移除鈕的 muted-foreground 太接近，× 幾乎看不見
              className={cn(
                'gap-1 bg-tertiary-container pr-1 text-on-tertiary-container',
                flashTag === tag &&
                  'animate-pulse ring-2 ring-tertiary motion-reduce:animate-none',
              )}
              data-testid={`tag-input-tag-${tag}`}
              data-duplicate={flashTag === tag ? 'true' : undefined}
            >
              <span className="max-w-40 truncate">{tag}</span>
              <button
                type="button"
                aria-label={removeLabel(tag)}
                data-testid={`tag-input-remove-${tag}`}
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="rounded-full text-on-tertiary-container/70 transition-colors hover:text-on-tertiary-container"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </InputGroupAddon>
      )}
      <InputGroupInput
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        disabled={isFull}
        maxLength={maxLength}
        placeholder={placeholder}
        // 🔴 aria-invalid 要落在 input 上，InputGroup 的錯誤態選擇器才會命中
        aria-invalid={ariaInvalid}
        data-testid={inputTestId}
      />
    </InputGroup>
  )
}
