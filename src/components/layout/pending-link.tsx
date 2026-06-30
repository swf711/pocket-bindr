'use client'

import Link, { useLinkStatus } from 'next/link'
import { useEffect, useState, type ComponentProps } from 'react'
import { Progress } from '@/components/ui/progress'

/**
 * 導航進度條：以 Next 原生 useLinkStatus 取得「該 Link 是否正在導航中」，
 * 用 shadcn Progress 呈現，固定貼齊 header 底部（header 高 h-16 → top-16）。
 * 必須是 <Link> 的後代才能拿到 pending 狀態，故由 PendingLink / 既有 Link 內部渲染。
 * 限 <Link> 點擊導航才會反映 pending，router.push 不涵蓋。
 * value 採 trickle 動畫（快速衝到約 90% 後停住），給「載入中」的進度感。
 */
export function NavProgressBar() {
  const { pending } = useLinkStatus()
  const [value, setValue] = useState(10)

  useEffect(() => {
    if (!pending) return
    setValue(10)
    const t1 = setTimeout(() => setValue(60), 50)
    const t2 = setTimeout(() => setValue(90), 350)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [pending])

  if (!pending) return null
  return (
    <Progress
      data-testid="nav-progress"
      aria-hidden
      value={value}
      className="fixed inset-x-0 top-16 z-50 h-1 rounded-none bg-transparent"
    />
  )
}

/**
 * Link 的薄包裝：照常渲染 next/link，並附帶頂部進度條。
 * props 透傳，data-testid / aria-label 等照常生效。
 */
export function PendingLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <NavProgressBar />
    </Link>
  )
}
