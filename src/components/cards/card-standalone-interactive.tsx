'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { CardStatus } from '@prisma/client'
import { BookCheck, Bookmark } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AddToBinderSection } from '@/components/cards/add-to-binder-section'
import { useAddToBinder } from '@/hooks/use-add-to-binder'
import { queryKeys } from '@/lib/query-keys'
import { CardWithCollectionStatus } from '@/types/card'

/**
 * 卡片獨立 SEO 頁的 client island——user-specific collectionStatus + 加入卡冊。
 * server 端只傳靜態內容（不進 unstable_cache），此處掛載後補 live 狀態，
 * 沿用既有 GET /api/cards/[id]（訪客可存取）與 AddToBinderSection，與 Drawer 三處復用點行為一致。
 */
export function CardStandaloneInteractive({ cardId }: { cardId: string }) {
  const t = useTranslations('cardDetail')
  const qc = useQueryClient()
  const [card, setCard] = useState<CardWithCollectionStatus | null>(null)
  const addToBinder = useAddToBinder()

  useEffect(() => {
    let cancelled = false
    fetch(`/api/cards/${cardId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setCard(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [cardId])

  if (!card) return null

  const handleAddToBinder = async (binderId: string, status: CardStatus, quantity: number) => {
    await addToBinder.mutateAsync({ card, binderId, status, quantity })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1" aria-label={t('owned')}>
              <BookCheck className="size-4" />
              <span className="font-medium text-foreground">{card.collectionStatus.owned ?? 0}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent><p>{t('owned')}</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1" aria-label={t('wanted')}>
              <Bookmark className="size-4" />
              <span className="font-medium text-foreground">{card.collectionStatus.wanted ?? 0}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent><p>{t('wanted')}</p></TooltipContent>
        </Tooltip>
      </div>
      <AddToBinderSection
        card={card}
        onAddToBinder={handleAddToBinder}
        onLoginSuccess={() => qc.invalidateQueries({ queryKey: queryKeys.cards.all })}
      />
    </div>
  )
}
