'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CardStatus } from '@prisma/client'
import { ArrowLeft, BookCheck, Bookmark } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { DialogHeaderClose } from '@/components/common/dialog-header-close'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GameSelector } from '@/components/cards/game-selector'
import { LanguageTabs } from '@/components/cards/language-tabs'
import { CardFilters } from '@/components/cards/card-filters'
import { CardGrid } from '@/components/cards/card-grid'
import { CardPagination } from '@/components/cards/card-pagination'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import type { CardWithCollectionStatus, SetGroup } from '@/types/card'

const DEFAULT_LANGUAGE = 'ZH_TW'

interface SlotCardPickerDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (cardId: string, status: CardStatus) => Promise<void>
}

export function SlotCardPickerDialog({ open, onClose, onConfirm }: SlotCardPickerDialogProps) {
  const t = useTranslations('binder.pickerDialog')
  const [game, setGame] = useState<string | null>(null)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [query, setQuery] = useState('')
  const [setId, setSetId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [groups, setGroups] = useState<SetGroup[]>([])
  const [cards, setCards] = useState<CardWithCollectionStatus[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [selectedCard, setSelectedCard] = useState<CardWithCollectionStatus | null>(null)
  const [status, setStatus] = useState<CardStatus>('owned')
  const [confirming, setConfirming] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    setGame(null)
    setLanguage(DEFAULT_LANGUAGE)
    setQuery('')
    setSetId(null)
    setPage(1)
    setGroups([])
    setCards([])
    setTotal(0)
    setTotalPages(0)
    setFetchError(null)
    setSelectedCard(null)
    setStatus('owned')
  }, [])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const fetchCards = useCallback(async (g: string, q: string, sid: string | null, p: number, lang: string) => {
    setLoading(true)
    const params = new URLSearchParams({ game: g, language: lang, page: String(p), pageSize: '20' })
    if (q) params.set('q', q)
    if (sid) params.set('setId', sid)
    try {
      const res = await fetch(`/api/cards?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCards(data.cards)
        setTotal(data.total ?? data.cards.length)
        setTotalPages(data.totalPages)
        setFetchError(null)
      } else {
        const errData = await res.json().catch(() => ({}))
        setFetchError((errData as { error?: string }).error ?? t('loadFailed'))
      }
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchSets = useCallback(async (g: string, lang: string) => {
    try {
      const res = await fetch(`/api/sets?game=${g}&language=${lang}`)
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups ?? [])
      }
    } catch { /* ignore */ }
  }, [])

  const handleGameChange = (g: string) => {
    setGame(g)
    setQuery('')
    setSetId(null)
    setPage(1)
    setGroups([])
    setCards([])
    setFetchError(null)
    fetchSets(g, language)
    fetchCards(g, '', null, 1, language)
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setSetId(null)
    setPage(1)
    setFetchError(null)
    if (game) {
      setGroups([])
      fetchSets(game, lang)
      fetchCards(game, query, null, 1, lang)
    }
  }

  const handleQueryChange = (q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      if (game) fetchCards(game, q, setId, 1, language)
    }, 300)
  }

  const handleSetChange = (sid: string | null) => {
    setSetId(sid)
    setPage(1)
    if (game) fetchCards(game, query, sid, 1, language)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    if (game) fetchCards(game, query, setId, p, language)
  }

  const handleConfirm = async () => {
    if (!selectedCard) return
    setConfirming(true)
    try {
      await onConfirm(selectedCard.id, status)
    } finally {
      setConfirming(false)
    }
  }

  const displayImage = selectedCard
    ? getCardImageUrl(
        !selectedCard.isCollectible && selectedCard.canonicalCard
          ? selectedCard.canonicalCard.imageSmall
          : selectedCard.imageSmall,
      )
    : null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100%-2rem)] lg:max-w-5xl" data-testid="slot-card-picker-dialog" showCloseButton={false}>
        <DialogHeaderClose className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{selectedCard ? t('selectStatus') : t('selectCard')}</DialogTitle>
        </DialogHeaderClose>

        <ScrollArea className="flex-1 min-h-0">
          {!selectedCard ? (
            <div className="space-y-4 px-6 py-4">
              {!game && <GameSelector selected={game} onSelect={handleGameChange} />}

              {game && (
                <>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex flex-wrap items-center gap-3">
                      <GameSelector selected={game} onSelect={handleGameChange} />
                      <LanguageTabs language={language} onLanguageChange={handleLanguageChange} />
                    </div>
                    <CardFilters
                      className="lg:flex-1"
                      query={query}
                      onQueryChange={handleQueryChange}
                      groups={groups}
                      selectedSetId={setId}
                      onSetChange={handleSetChange}
                    />
                  </div>

                  {loading ? (
                    <CardGrid cards={[]} onCardClick={() => {}} loading />
                  ) : fetchError ? (
                    <div className="text-center py-12 text-destructive">{fetchError}</div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-center">
                          {t('resultCount', { count: total })}
                        </p>
                        <CardPagination
                          className="md:mx-0 md:w-auto md:justify-end"
                          currentPage={page}
                          totalPages={totalPages}
                          onPageChange={handlePageChange}
                        />
                      </div>
                      <CardGrid cards={cards} onCardClick={setSelectedCard} />
                      <CardPagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 px-6 py-4">
              <Button
                variant="ghost"
                size="sm"
                data-testid="slot-card-picker-back"
                onClick={() => setSelectedCard(null)}
              >
                <ArrowLeft className="h-4 w-4" /> {t('backToSelectCard')}
              </Button>

              <div className="flex flex-col items-center gap-3">
                {displayImage && (
                  <img
                    src={displayImage}
                    alt={selectedCard.name}
                    className="w-40 rounded-md"
                  />
                )}
                <p className="font-semibold">{selectedCard.name}</p>
              </div>

              <Tabs value={status} onValueChange={(v) => setStatus(v as CardStatus)}>
                <TabsList className="w-full">
                  <TabsTrigger data-testid="picker-status-owned" value="owned" className="flex-1">
                    <BookCheck /> {t('owned')}
                  </TabsTrigger>
                  <TabsTrigger data-testid="picker-status-wanted" value="wanted" className="flex-1">
                    <Bookmark /> {t('wanted')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                className="w-full"
                data-testid="slot-card-picker-confirm"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? t('adding') : t('addCard')}
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
