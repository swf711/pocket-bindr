'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CardStatus } from '@prisma/client'
import { GameSelector } from './game-selector'
import { LanguageTabs } from './language-tabs'
import { CardFilters } from './card-filters'
import { CardGrid } from './card-grid'
import { CardPagination } from './card-pagination'
import { CardDetailDrawer } from './card-detail-drawer'
import { CardWithCollectionStatus, SetGroup } from '@/types/card'
import { AddToBinderResult } from '@/types/binder'

const DEFAULT_LANGUAGE = 'ZH_TW'
const VALID_LANGUAGES = ['EN', 'JA', 'ZH_TW']

interface CardSearchClientProps {
  initialParams: {
    game?: string
    q?: string
    setId?: string
    page?: string
    language?: string
  }
}

export function CardSearchClient({ initialParams }: CardSearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [game, setGame] = useState<string | null>(initialParams.game ?? null)
  const [query, setQuery] = useState(initialParams.q ?? '')
  const [setId, setSetId] = useState<string | null>(initialParams.setId ?? null)
  const [page, setPage] = useState(parseInt(initialParams.page ?? '1', 10))
  const [language, setLanguage] = useState(
    initialParams.language && VALID_LANGUAGES.includes(initialParams.language)
      ? initialParams.language
      : DEFAULT_LANGUAGE
  )

  const [cards, setCards] = useState<CardWithCollectionStatus[]>([])
  const [groups, setGroups] = useState<SetGroup[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const selectedCard = selectedIndex !== null ? cards[selectedIndex] ?? null : null

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key)
      else params.set(key, value)
    })
    router.push(`/cards?${params.toString()}`)
  }, [router, searchParams])

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
        setFetchError((errData as { error?: string }).error ?? '載入失敗，請稍後再試')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSets = useCallback(async (g: string, lang: string) => {
    try {
      const res = await fetch(`/api/sets?game=${g}&language=${lang}`)
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups ?? [])
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (game) {
      fetchSets(game, language)
      fetchCards(game, query, setId, page, language)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGameChange = (g: string) => {
    setGame(g)
    setQuery('')
    setSetId(null)
    setPage(1)
    setGroups([])
    setCards([])
    setFetchError(null)
    updateParams({ game: g, q: null, setId: null, page: null })
    fetchSets(g, language)
    fetchCards(g, '', null, 1, language)
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setSetId(null)
    setPage(1)
    setFetchError(null)
    updateParams({
      language: lang === DEFAULT_LANGUAGE ? null : lang,
      setId: null,
      page: null,
    })
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
      updateParams({ q: q || null, page: null })
      if (game) fetchCards(game, q, setId, 1, language)
    }, 300)
  }

  const handleSetChange = (sid: string | null) => {
    setSetId(sid)
    setPage(1)
    updateParams({ setId: sid, page: null })
    if (game) fetchCards(game, query, sid, 1, language)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    updateParams({ page: String(p) })
    if (game) fetchCards(game, query, setId, p, language)
  }

  const handleCollectionUpdate = (
    cardId: string,
    newStatus: { owned: number | null; wanted: number | null }
  ) => {
    setCards(prev =>
      prev.map(c => c.id === cardId ? { ...c, collectionStatus: newStatus } : c)
    )
  }

  const handleAddToBinder = async (binderId: string, status: CardStatus, quantity: number) => {
    if (!selectedCard) return
    const res = await fetch(`/api/binders/${binderId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: selectedCard.id, status, quantity }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error ?? '加入失敗')
    }
    const result: AddToBinderResult = await res.json()
    if (result.userCard) {
      const current = selectedCard.collectionStatus
      const newOwned = status === 'owned'
        ? (current.owned ?? 0) + quantity
        : (current.owned ?? null)
      const newWanted = status === 'wanted'
        ? (current.wanted ?? 0) + quantity
        : (current.wanted ?? null)
      handleCollectionUpdate(selectedCard.id, { owned: newOwned, wanted: newWanted })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">卡牌搜尋</h1>

      <div className="space-y-6">
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
                  <p data-testid="result-total" className="text-center">
                    搜尋結果 <span className="md:text-2xl font-bold">{total}</span> 張
                  </p>
                  <CardPagination
                    data-testid="card-pagination-top"
                    className="md:mx-0 md:w-auto md:justify-end"
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
                <CardGrid cards={cards} onCardClick={(card) => setSelectedIndex(cards.indexOf(card))} />
                <CardPagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </>
            )}
          </>
        )}
      </div>

      <CardDetailDrawer
        card={selectedCard}
        open={!!selectedCard}
        onClose={() => setSelectedIndex(null)}
        onAddToBinder={handleAddToBinder}
        onLoginSuccess={() => { if (game) fetchCards(game, query, setId, page, language) }}
        cards={cards}
        currentIndex={selectedIndex ?? 0}
        onNavigate={setSelectedIndex}
      />
    </div>
  )
}
