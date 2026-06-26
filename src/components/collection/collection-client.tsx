'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CardStatus } from '@prisma/client'
import { CardGrid } from '@/components/cards/card-grid'
import { CardPagination } from '@/components/cards/card-pagination'
import { CardDetailDrawer } from '@/components/cards/card-detail-drawer'
import { CollectionFilters } from './collection-filters'
import { useCollectionList } from '@/hooks/use-collection-list'
import { useAddToBinder } from '@/hooks/use-add-to-binder'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { SetGroup } from '@/types/card'

interface CollectionClientProps {
  initialParams: {
    status?: string
    game?: string
    language?: string
    setId?: string
    q?: string
    page?: string
  }
}

function parseStatus(v?: string): 'all' | 'owned' | 'wanted' {
  if (v === 'owned' || v === 'wanted') return v
  return 'all'
}

export function CollectionClient({ initialParams }: CollectionClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()

  const [status, setStatus] = useState<'all' | 'owned' | 'wanted'>(parseStatus(initialParams.status))
  const [game, setGame] = useState(initialParams.game ?? '')
  const [language, setLanguage] = useState(initialParams.language ?? '')
  const [setId, setSetId] = useState<string | null>(initialParams.setId ?? null)
  const [query, setQuery] = useState(initialParams.q ?? '')
  const [page, setPage] = useState(parseInt(initialParams.page ?? '1', 10))
  const [groups, setGroups] = useState<SetGroup[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filters = {
    ...(status !== 'all' ? { status } : {}),
    ...(game ? { game } : {}),
    ...(language ? { language } : {}),
    ...(setId ? { setId } : {}),
    ...(query ? { q: query } : {}),
    page,
  }

  const { data, isPending, isError, error } = useCollectionList(filters)
  const addToBinder = useAddToBinder()

  const cards = data?.cards ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0
  const selectedCard = selectedIndex !== null ? cards[selectedIndex] ?? null : null

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) params.delete(key)
        else params.set(key, value)
      })
      router.push(`/collection?${params.toString()}`)
    },
    [router, searchParams],
  )

  const fetchSets = useCallback(async (g: string, lang: string) => {
    if (!g || !lang) return
    try {
      const res = await fetch(`/api/sets?game=${g}&language=${lang}`)
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups ?? [])
      }
    } catch {
      /* ignore */
    }
  }, [])

  const handleStatusChange = (s: 'all' | 'owned' | 'wanted') => {
    setStatus(s)
    setPage(1)
    updateParams({ status: s === 'all' ? null : s, page: null })
  }

  const handleGameChange = (g: string) => {
    setGame(g)
    setSetId(null)
    setPage(1)
    setGroups([])
    updateParams({ game: g || null, setId: null, page: null })
    if (g && language) fetchSets(g, language)
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setSetId(null)
    setPage(1)
    setGroups([])
    updateParams({ language: lang || null, setId: null, page: null })
    if (game && lang) fetchSets(game, lang)
  }

  const handleSetChange = (sid: string | null) => {
    setSetId(sid)
    setPage(1)
    updateParams({ setId: sid, page: null })
  }

  const handleQueryChange = (q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      updateParams({ q: q || null, page: null })
    }, 300)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    updateParams({ page: String(p) })
  }

  const handleAddToBinder = async (binderId: string, cardStatus: CardStatus, quantity: number) => {
    if (!selectedCard) return
    await addToBinder.mutateAsync({ card: selectedCard, binderId, status: cardStatus, quantity })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">我的收藏</h1>

      <div className="space-y-6">
        <CollectionFilters
          status={status}
          onStatusChange={handleStatusChange}
          game={game}
          onGameChange={handleGameChange}
          language={language}
          onLanguageChange={handleLanguageChange}
          groups={groups}
          selectedSetId={setId}
          onSetChange={handleSetChange}
          query={query}
          onQueryChange={handleQueryChange}
        />

        {isPending ? (
          <CardGrid cards={[]} onCardClick={() => {}} loading />
        ) : isError ? (
          <div className="text-center py-12 text-destructive">
            {(error as Error)?.message ?? '載入失敗，請稍後再試'}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="collection-empty">
            {total === 0 ? '還沒有任何收藏，前往卡牌搜尋頁標記卡牌吧！' : '沒有符合條件的卡牌'}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p data-testid="collection-total" className="text-center">
                共 <span className="md:text-2xl font-bold">{total}</span> 張
              </p>
              <CardPagination
                data-testid="collection-pagination-top"
                className="md:mx-0 md:w-auto md:justify-end"
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
            <CardGrid
              cards={cards}
              onCardClick={card => setSelectedIndex(cards.indexOf(card))}
            />
            <CardPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <CardDetailDrawer
        card={selectedCard}
        open={!!selectedCard}
        onClose={() => setSelectedIndex(null)}
        onAddToBinder={handleAddToBinder}
        onLoginSuccess={() => {
          qc.invalidateQueries({ queryKey: ['collection', 'list'] })
          qc.invalidateQueries({ queryKey: queryKeys.cards.all })
        }}
        cards={cards}
        currentIndex={selectedIndex ?? 0}
        onNavigate={setSelectedIndex}
      />
    </div>
  )
}
