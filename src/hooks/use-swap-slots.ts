'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { applySwap } from '@/lib/binder-cache-utils'
import type { BinderDetailResponse } from '@/types/binder'

type SwapInput = {
  binderId: string
  slotAId: string
  slotBId: string
}

async function patchSlotSwap(input: SwapInput) {
  const res = await fetch(`/api/binders/${input.binderId}/slots/swap`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotAId: input.slotAId, slotBId: input.slotBId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'スワップ失敗')
  }
  return res.json()
}

export function useSwapSlots() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: patchSlotSwap,
    onMutate: async (input) => {
      const key = queryKeys.binders.detail(input.binderId)
      await qc.cancelQueries({ queryKey: key })
      const snapshot = qc.getQueryData<BinderDetailResponse>(key)
      qc.setQueryData<BinderDetailResponse>(key, (old) => applySwap(old, input))
      return { snapshot, key }
    },
    onError: (_err, _input, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.snapshot)
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: queryKeys.binders.detail(input.binderId) })
    },
  })
}
