'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { ClientError } from '@/lib/client-error'
import type { BatchAddToBinderResult } from '@/types/binder'

export type BatchAddToBinderInput = {
  cardIds: string[]
  binderId: string
  status: 'owned' | 'wanted'
  quantity: number
}

async function postBinderCardsBatch(input: BatchAddToBinderInput): Promise<BatchAddToBinderResult> {
  const res = await fetch(`/api/binders/${input.binderId}/cards/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardIds: input.cardIds, status: input.status, quantity: input.quantity }),
  })
  if (!res.ok) {
    if (res.status === 409) throw new ClientError('BATCH_CAPACITY_EXCEEDED')
    if (res.status === 429) throw new ClientError('BATCH_RATE_LIMITED')
    throw new ClientError('BATCH_ADD_FAILED')
  }
  return res.json()
}

export function useBatchAddToBinder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postBinderCardsBatch,
    onSuccess: (_result, input) => {
      // 批次可能涵蓋多張卡（含 OPCG ZH_TW alias），用 ['collection'] 前綴一次涵蓋
      // byCard（['collection', id]）與 list（['collection','list',filters]）兩種查詢鍵
      qc.invalidateQueries({ queryKey: ['collection'] })
      qc.invalidateQueries({ queryKey: queryKeys.cards.all })
      qc.invalidateQueries({ queryKey: queryKeys.binders.detail(input.binderId) })
      qc.invalidateQueries({ queryKey: queryKeys.binders.list() })
    },
  })
}
