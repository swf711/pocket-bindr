'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CardStatus } from '@prisma/client'
import { GameSelector } from './game-selector'
import { LanguageTabs } from './language-tabs'
import { CardFilters } from './card-filters'
import { CardGrid } from './card-grid'
import { CardPagination } from './card-pagination'
import { CardDetailDrawer } from './card-detail-drawer'
import { SetGroup } from '@/types/card'
import { useQueryClient } from '@tanstack/react-query'
import { useCardSearch } from '@/hooks/use-card-search'
import { useAddToBinder } from '@/hooks/use-add-to-binder'
import { queryKeys } from '@/lib/query-keys'

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
  const t = useTranslations('cards')

  const [game, setGame] = useState<string | null>(initialParams.game ?? null)
  const [query, setQuery] = useState(initialParams.q ?? '')
  const [setId, setSetId] = useState<string | null>(initialParams.setId ?? null)
  const [page, setPage] = useState(parseInt(initialParams.page ?? '1', 10))
  const [language, setLanguage] = useState(
    initialParams.language && VALID_LANGUAGES.includes(initialParams.language)
      ? initialParams.language
      : DEFAULT_LANGUAGE
  )
  const [groups, setGroups] = useState<SetGroup[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filters = game
    ? { game, language, q: query || undefined, setId: setId ?? undefined, page }
    : { game: '', language, page }

  const qc = useQueryClient()
  const { data, isPending, isError } = useCardSearch(filters)
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
      router.push(`/cards?${params.toString()}`)
    },
    [router, searchParams],
  )

  const fetchSets = useCallback(async (g: string, lang: string) => {
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

  // URL に game パラメータがある状態で直接アクセスした場合の初回 sets ロード
  useEffect(() => {
    if (game) fetchSets(game, language)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGameChange = (g: string) => {
    setGame(g)
    setQuery('')
    setSetId(null)
    setPage(1)
    setGroups([])
    updateParams({ game: g, q: null, setId: null, page: null })
    fetchSets(g, language)
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setSetId(null)
    setPage(1)
    updateParams({
      language: lang === DEFAULT_LANGUAGE ? null : lang,
      setId: null,
      page: null,
    })
    if (game) {
      setGroups([])
      fetchSets(game, lang)
    }
  }

  const handleQueryChange = (q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      updateParams({ q: q || null, page: null })
    }, 300)
  }

  const handleSetChange = (sid: string | null) => {
    setSetId(sid)
    setPage(1)
    updateParams({ setId: sid, page: null })
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    updateParams({ page: String(p) })
  }

  const handleAddToBinder = async (binderId: string, status: CardStatus, quantity: number) => {
    if (!selectedCard) return
    await addToBinder.mutateAsync({
      card: selectedCard,
      binderId,
      status,
      quantity,
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

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

            {isPending ? (
              <CardGrid cards={[]} onCardClick={() => {}} loading />
            ) : isError ? (
              <div className="text-center py-12 text-destructive">
                {t('loadFailed')}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p data-testid="result-total" className="text-center">
                    {t('resultPrefix')} <span className="md:text-2xl font-bold">{total}</span> {t('resultSuffix')}
                  </p>
                  <CardPagination
                    data-testid="card-pagination-top"
                    className="md:mx-0 md:w-auto md:justify-end"
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
                <CardGrid
                  cards={cards}
                  onCardClick={(card) => setSelectedIndex(cards.indexOf(card))}
                />
                <CardPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
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
        onLoginSuccess={() => {
          // 登入後 collectionStatus 以 session 為依據，需強制重抓搜尋結果
          qc.invalidateQueries({ queryKey: queryKeys.cards.all })
        }}
        cards={cards}
        currentIndex={selectedIndex ?? 0}
        onNavigate={setSelectedIndex}
      />
    </div>
  )
}
