'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { resolveCollectionCardId } from '@/lib/resolve-card-id'
import type { AddToBinderResult } from '@/types/binder'

export type AddToBinderInput = {
  card: { id: string; isCollectible: boolean; canonicalCardId: string | null }
  binderId: string
  status: 'owned' | 'wanted'
  quantity: number
}
// CardWithCollectionStatus（含 canonicalCardId 欄位）完全滿足此型別

async function postBinderCards(input: AddToBinderInput): Promise<AddToBinderResult> {
  // 送原始 cardId（不在前端預先 resolve），讓後端 resolve canonical 並記錄
  // displayCardId 保留原始顯示語言（OPCG ZH_TW alias）。
  const res = await fetch(`/api/binders/${input.binderId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId: input.card.id, status: input.status, quantity: input.quantity }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? '加入失敗')
  }
  return res.json()
}

export function useAddToBinder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postBinderCards,
    onSuccess: (result, input) => {
      const resolvedId = resolveCollectionCardId(input.card)
      // per-card badge（alias 卡以 canonicalCardId 為 key，JA 與 ZH_TW 徽章同步）
      qc.invalidateQueries({ queryKey: queryKeys.collection.byCard(resolvedId) })
      // 搜尋頁所有篩選組合的 collectionStatus（前綴失效）
      qc.invalidateQueries({ queryKey: queryKeys.cards.all })
      // 目標卡冊內頁
      qc.invalidateQueries({ queryKey: queryKeys.binders.detail(input.binderId) })
      // 卡冊列表的格位數
      qc.invalidateQueries({ queryKey: queryKeys.binders.list() })
    },
  })
}
