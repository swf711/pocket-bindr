interface BinderCoverPanelProps {
  coverColor: string
}

// Decorative inner cover page — not a droppable target
export function BinderCoverPanel({ coverColor }: BinderCoverPanelProps) {
  return (
    <div
      data-testid="binder-cover-panel"
      data-droppable="false"
      className="w-full h-full min-h-100 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: coverColor }}
    />
  )
}
