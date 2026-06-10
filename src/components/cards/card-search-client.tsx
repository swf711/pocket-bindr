'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { GameSelector } from './game-selector'
import { CardFilters } from './card-filters'
import { CardGrid } from './card-grid'
import { Pagination } from './pagination'
import { LoginModal } from '../auth/login-modal'

interface CardData {
  id: string
  name: string
  imageSmall: string
  imageLarge: string
  rarity: string | null
  hp: number | null
  types: string[]
  cardNumber: string
  collectionStatus: string | null
  set: { id: string; name: string; series: string }
}

interface SetOption {
  id: string
  name: string
  series: string
}

interface CardSearchClientProps {
  initialParams: {
    game?: string
    q?: string
    setId?: string
    page?: string
  }
}

export function CardSearchClient({ initialParams }: CardSearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [game, setGame] = useState<string | null>(initialParams.game ?? null)
  const [query, setQuery] = useState(initialParams.q ?? '')
  const [setId, setSetId] = useState<string | null>(initialParams.setId ?? null)
  const [page, setPage] = useState(parseInt(initialParams.page ?? '1', 10))

  const [cards, setCards] = useState<CardData[]>([])
  const [sets, setSets] = useState<SetOption[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key)
      else params.set(key, value)
    })
    router.push(`/cards?${params.toString()}`)
  }, [router, searchParams])

  const fetchCards = useCallback(async (g: string, q: string, sid: string | null, p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ game: g, page: String(p), pageSize: '20' })
    if (q) params.set('q', q)
    if (sid) params.set('setId', sid)
    try {
      const res = await fetch(`/api/cards?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCards(data.cards)
        setTotalPages(data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSets = useCallback(async (g: string) => {
    try {
      const res = await fetch(`/api/sets?game=${g}`)
      if (res.ok) {
        const data = await res.json()
        setSets(data.sets)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (game) {
      fetchSets(game)
      fetchCards(game, query, setId, page)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGameChange = (g: string) => {
    setGame(g)
    setQuery('')
    setSetId(null)
    setPage(1)
    setSets([])
    setCards([])
    updateParams({ game: g, q: null, setId: null, page: null })
    fetchSets(g)
    fetchCards(g, '', null, 1)
  }

  const handleQueryChange = (q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      updateParams({ q: q || null, page: null })
      if (game) fetchCards(game, q, setId, 1)
    }, 300)
  }

  const handleSetChange = (sid: string | null) => {
    setSetId(sid)
    setPage(1)
    updateParams({ setId: sid, page: null })
    if (game) fetchCards(game, query, sid, 1)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    updateParams({ page: String(p) })
    if (game) fetchCards(game, query, setId, p)
  }

  const executeToggle = async (cardId: string, newStatus: string | null) => {
    const prevCards = [...cards]
    setCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, collectionStatus: newStatus } : card
    ))
    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, status: newStatus }),
      })
      if (!res.ok) setCards(prevCards)
    } catch {
      setCards(prevCards)
    }
  }

  const handleCollectionToggle = (cardId: string, status: string | null) => {
    if (!session) {
      setPendingAction(() => () => executeToggle(cardId, status))
      setShowLoginModal(true)
      return
    }
    executeToggle(cardId, status)
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    pendingAction?.()
    setPendingAction(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">卡牌搜尋</h1>

      <div className="space-y-6">
        <GameSelector selected={game} onSelect={handleGameChange} />

        {game && (
          <>
            <CardFilters
              query={query}
              onQueryChange={handleQueryChange}
              sets={sets}
              selectedSetId={setId}
              onSetChange={handleSetChange}
            />

            {loading ? (
              <CardGrid cards={[]} onToggle={handleCollectionToggle} loading />
            ) : (
              <>
                <CardGrid cards={cards} onToggle={handleCollectionToggle} />
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </>
            )}
          </>
        )}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => { setShowLoginModal(false); setPendingAction(null) }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  )
}
