'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type IconTooltipButtonProps = React.ComponentProps<typeof Button> & {
  /** 提示文字（同時用於滑鼠 hover tooltip 與 aria-label，確保 icon-only 按鈕可讀） */
  tooltip: string
}

/**
 * icon-only 按鈕的延伸元件：組合原生 shadcn Button + Tooltip。
 * 為純圖示按鈕補上 hover 提示與 aria-label，集中樣式避免各處重複 Tooltip 包裹。
 * 需要 AlertDialogTrigger / Link 等 asChild 巢狀的特殊情境請直接手寫 Tooltip 包裹。
 */
export function IconTooltipButton({
  tooltip,
  'aria-label': ariaLabel,
  ...props
}: IconTooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={ariaLabel ?? tooltip} {...props} />
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
