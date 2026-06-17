import { Plus } from 'lucide-react'

interface AddBinderSlotProps {
  onClick: () => void
}

export function AddBinderSlot({ onClick }: AddBinderSlotProps) {
  return (
    <button
      type="button"
      className="aspect-2.5/3.5 rounded-r-lg border-2 border-dashed border-muted-foreground/40
                 flex flex-col items-center justify-center gap-2 text-muted-foreground
                 hover:border-primary hover:text-primary transition-colors w-full cursor-pointer"
      onClick={onClick}
      data-testid="add-binder-slot"
    >
      <Plus className="w-8 h-8" />
      <span className="text-sm">新增卡冊</span>
    </button>
  )
}
