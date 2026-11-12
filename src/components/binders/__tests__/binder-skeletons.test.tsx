/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BinderListSkeleton } from '../binder-list-skeleton'
import { BinderDetailSkeleton, BinderSpreadSkeleton } from '@/components/binder/binder-detail-skeleton'

describe('BinderListSkeleton', () => {
  it('渲染 binder-list-skeleton 容器', () => {
    render(<BinderListSkeleton />)
    expect(screen.getByTestId('binder-list-skeleton')).toBeInTheDocument()
  })
})

describe('BinderDetailSkeleton', () => {
  it('渲染 binder-detail-skeleton 容器', () => {
    render(<BinderDetailSkeleton />)
    expect(screen.getByTestId('binder-detail-skeleton')).toBeInTheDocument()
  })
})

describe('BinderSpreadSkeleton', () => {
  it('預設顯示返回鈕與 header 動作按鈕群（詳情頁情境）', () => {
    const { container } = render(<BinderSpreadSkeleton />)
    // 桌面與行動裝置各一組 header，皆有 spread 面板骨架
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('關閉 header 動作按鈕群時，骨架數量少 8 個（桌面 4 + 行動 4）', () => {
    const withActions = render(<BinderSpreadSkeleton />).container.querySelectorAll(
      '[data-slot="skeleton"]',
    ).length
    const withoutActions = render(
      <BinderSpreadSkeleton showHeaderActions={false} />,
    ).container.querySelectorAll('[data-slot="skeleton"]').length
    expect(withActions - withoutActions).toBe(8)
  })

  it('公開分享頁情境不顯示返回鈕與動作按鈕，改顯示 owner banner', () => {
    const { container } = render(
      <BinderSpreadSkeleton showBackButton={false} showHeaderActions={false} showOwnerBanner />
    )
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('翻頁骨架為兩顆膠囊夾一段文字（對齊實際的兩組 ButtonGroup），桌面與行動各一組', () => {
    render(<BinderSpreadSkeleton />)
    const groups = screen.getAllByTestId('pagination-skeleton')
    expect(groups).toHaveLength(2)
    for (const group of groups) {
      const parts = group.querySelectorAll('[data-slot="skeleton"]')
      expect(parts).toHaveLength(3)
      expect(parts[0].className).toContain('w-20')
      expect(parts[2].className).toContain('w-20')
    }
  })

  it('行動版 header 與卡冊面板位於同一個置中欄，左右邊對齊', () => {
    render(<BinderSpreadSkeleton />)
    const column = screen.getByTestId('mobile-skeleton-column')
    expect(column.className).toContain('max-w-sm')
    expect(column.className).toContain('mx-auto')
    // header (first child) and panel wrapper both live inside the shared column
    expect(column.children).toHaveLength(2)
  })
})
