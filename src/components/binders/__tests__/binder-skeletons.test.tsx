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
  it('預設顯示返回鈕與設定鈕（詳情頁情境）', () => {
    const { container } = render(<BinderSpreadSkeleton />)
    // 桌面與行動裝置各一組 header，皆有 spread 面板骨架
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('公開分享頁情境不顯示返回鈕與設定鈕，改顯示 owner banner', () => {
    const { container } = render(
      <BinderSpreadSkeleton showBackButton={false} showSettingsButton={false} showOwnerBanner />
    )
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })
})
