import type { BinderDetailResponse } from '@/types/binder'

export function applySwap(
  old: BinderDetailResponse | undefined,
  input: { slotAId: string; slotBId: string },
): BinderDetailResponse | undefined {
  if (!old) return old
  const slotA = old.slots.find((s) => s.id === input.slotAId)
  const slotB = old.slots.find((s) => s.id === input.slotBId)
  if (!slotA || !slotB) return old
  return {
    ...old,
    slots: old.slots.map((s) => {
      if (s.id === input.slotAId)
        return { ...s, pageNumber: slotB.pageNumber, slotIndex: slotB.slotIndex }
      if (s.id === input.slotBId)
        return { ...s, pageNumber: slotA.pageNumber, slotIndex: slotA.slotIndex }
      return s
    }),
  }
}
