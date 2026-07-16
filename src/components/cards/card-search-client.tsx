'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { type Game, type Language } from '@prisma/client'
import { ListChecks, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameSelector } from './game-selector'
import { LanguageTabs } from './language-tabs'
import { CardFilters } from './card-filters'
import { CardGrid } from './card-grid'
import { CardPagination } from './card-pagination'
import { BatchAddBar } from './batch-add-bar'
import { SetGroup, CardWithCollectionStatus } from '@/types/card'
import { useCardSearch } from '@/hooks/use-card-search'
import { cardPath } from '@/lib/card-url'
import { publishCardNavList } from '@/lib/card-nav-store'
import { MAX_BATCH_CARDS } from '@/lib/binder-limits'

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
  const tBatch = useTranslations('cards.batch')

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
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filters = game
    ? { game, language, q: query || undefined, setId: setId ?? undefined, page }
    : { game: '', language, page }

  const { data, isPending, isError } = useCardSearch(filters)

  const cards = useMemo(() => data?.cards ?? [], [data])
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0

  // 攔截路由的 modal（card-modal-client.tsx）從此 in-memory store 取當前卡 + prev/next，
  // 免在 URL 夾帶 filter context；零 server round-trip 才能維持「點卡立刻出現」的手感。
  useEffect(() => {
    publishCardNavList(cards)
  }, [cards])

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
    setSelectedIds(new Set())
    updateParams({ game: g, q: null, setId: null, page: null })
    fetchSets(g, language)
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setSetId(null)
    setPage(1)
    setSelectedIds(new Set())
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
      setSelectedIds(new Set())
      updateParams({ q: q || null, page: null })
    }, 300)
  }

  const handleSetChange = (sid: string | null) => {
    setSetId(sid)
    setPage(1)
    setSelectedIds(new Set())
    updateParams({ setId: sid, page: null })
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    updateParams({ page: String(p) })
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
  }

  const handleToggleSelectMode = () => {
    setSelectMode((prev) => !prev)
    setSelectedIds(new Set())
  }

  const handleToggleSelect = (card: CardWithCollectionStatus) => {
    const next = new Set(selectedIds)
    if (next.has(card.id)) {
      next.delete(card.id)
    } else {
      if (next.size >= MAX_BATCH_CARDS) {
        toast.error(tBatch('maxReached', { max: MAX_BATCH_CARDS }))
        return
      }
      next.add(card.id)
    }
    setSelectedIds(next)
    // 取消勾選至歸零視同退出多選模式（回到一般點卡開卡片的狀態）
    if (next.size === 0) setSelectMode(false)
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
                game={game as Game}
                language={language as Language}
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
                  <div className="flex items-center justify-between gap-3 md:justify-start">
                    <p data-testid="result-total">
                      {t('resultPrefix')} <span className="md:text-2xl font-bold">{total}</span> {t('resultSuffix')}
                    </p>
                    <Button
                      data-testid="batch-select-mode-toggle"
                      variant={selectMode ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={handleToggleSelectMode}
                      className="shrink-0"
                    >
                      {selectMode ? <X /> : <ListChecks />}
                      {selectMode ? tBatch('cancel') : tBatch('enter')}
                    </Button>
                  </div>
                  <CardPagination
                    data-testid="card-pagination-top"
                    className="md:mx-0 md:w-auto md:justify-end"
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
                {/* cardHref 兩種模式都傳（維持 <Link>，避免切換多選時整批卡圖重掛/重載）；
                    多選時由 CardItem 內 onClick preventDefault 攔下導航改勾選 */}
                <CardGrid
                  cards={cards}
                  onCardClick={() => {}}
                  cardHref={cardPath}
                  selectable={selectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                />
                <CardPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
                {/* 批次 bar 為 fixed 覆蓋層，留一段等高 spacer 讓最後一排卡片可捲到 bar 上方、不被遮住 */}
                {selectMode && selectedIds.size > 0 && (
                  <div aria-hidden className="h-24" />
                )}
              </>
            )}
          </>
        )}
      </div>

      {selectMode && selectedIds.size > 0 && (
        <BatchAddBar
          selectedIds={Array.from(selectedIds)}
          onSuccess={() => {
            setSelectMode(false)
            setSelectedIds(new Set())
          }}
          onCancel={() => {
            // 取消視同退出多選模式
            setSelectMode(false)
            setSelectedIds(new Set())
          }}
        />
      )}
    </div>
  )
}
