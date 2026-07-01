'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group'

/**
 * 密碼輸入框延伸元件：在 shadcn InputGroup 內組合密碼 Input + 眼睛 toggle 按鈕。
 * 不修改原生 ui 元件；接受所有原生 input props（id/value/onChange/autoComplete/data-testid…）。
 */
export function PasswordInput(props: Omit<React.ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  const t = useTranslations('auth')
  const label = visible ? t('hidePassword') : t('showPassword')

  return (
    <InputGroup>
      <InputGroupInput type={visible ? 'text' : 'password'} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-sm"
          aria-label={label}
          title={label}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
