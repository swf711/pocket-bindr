/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TwoColumnSelectGroup } from '../two-column-select-group'

// TwoColumnSelectGroup renders SelectGroup (Radix UI) and SelectLabel.
// Radix Select primitives don't require a Select root context for the Group
// and Label nodes to mount — they render as plain divs/spans in jsdom.
describe('TwoColumnSelectGroup', () => {
  it('renders children in grid-cols-2 layout', () => {
    const { container } = render(
      <TwoColumnSelectGroup>
        <span>Item A</span>
        <span>Item B</span>
      </TwoColumnSelectGroup>
    )
    // The SelectGroup wrapper should have grid-cols-2 class
    const group = container.firstElementChild
    expect(group?.className).toContain('grid-cols-2')
  })

  it('renders label when provided', () => {
    render(
      <TwoColumnSelectGroup label="Test Label">
        <span>Item</span>
      </TwoColumnSelectGroup>
    )
    expect(screen.getByText('Test Label')).toBeTruthy()
  })

  it('renders without label when omitted', () => {
    const { container } = render(
      <TwoColumnSelectGroup>
        <span>Item</span>
      </TwoColumnSelectGroup>
    )
    // No SelectLabel should be rendered, so no label element beyond the child
    // The group node itself should not contain label text
    expect(container.querySelector('[data-slot="select-label"]')).toBeNull()
  })

  it('passes through className to wrapper', () => {
    const { container } = render(
      <TwoColumnSelectGroup className="custom-class">
        <span>Item</span>
      </TwoColumnSelectGroup>
    )
    const group = container.firstElementChild
    expect(group?.className).toContain('custom-class')
    // Should still have the base grid-cols-2 class from cn()
    expect(group?.className).toContain('grid-cols-2')
  })
})
