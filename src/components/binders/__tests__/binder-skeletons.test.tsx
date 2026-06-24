/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BinderListSkeleton } from '../binder-list-skeleton'
import { BinderDetailSkeleton } from '@/components/binder/binder-detail-skeleton'

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
