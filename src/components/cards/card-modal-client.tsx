'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { CardStatus } from '@prisma/client'
import { CardDetailDrawer } from '@/components/cards/card-detail-drawer'
import { subscribeCardNavList, getCardNavListSnapshot } from '@/lib/card-nav-store'
import { cardPath, parseCardPathParams } from '@/lib/card-url'
import { useAddToBinder } from '@/hooks/use-add-to-binder'
import { queryKeys } from '@/lib/query-keys'

interface CardModalClientProps {
  game: string
  language: string
  externalId: string
}

interface CardIdentity {
  game: string
  language: string
  externalId: string
}

/**
 * 攔截路由渲染的 modal——UX 保真核心：從 in-memory card-nav-store 即時取當前卡 + prev/next，
 * 零 server round-trip，維持「點卡 → Drawer 立刻出現」的既有手感（見 discuss-feature 鎖定決策）。
 *
 * 兩個曾實測到的坑，靠這個設計一併解決：
 * 1. prev/next 刻意不用 router.push：App Router 的 push 對每次切卡都觸發一次 RSC round-trip
 *    （@modal 的 Server Component page.tsx 需重新解析路由樹），破壞「切卡零延遲」的手感。改用
 *    window.history.replaceState 只同步網址列（Next.js 官方支援的模式——usePathname/
 *    useSearchParams 會自動與 pushState/replaceState 保持同步），卡片切換純走本地 identity state。
 * 2. store 以 useSyncExternalStore 訂閱（非掛載時讀一次快照）：加入卡冊後 collectionStatus
 *    靠列表重抓更新，若 modal 只在掛載時凍結 cards 陣列，重抓後的新數字進不了已開啟的 modal。
 *
 * 呼叫端傳入的 game/language/externalId 只在「真正的路由跳轉」（初次開啟、或直接點擊背景列表中
 * 另一張卡）才會變動；父層 page.tsx 以此三者組 key 強制 remount 取得新起點。
 */
export function CardModalClient({ game, language, externalId }: CardModalClientProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const addToBinder = useAddToBinder()

  const cards = useSyncExternalStore(subscribeCardNavList, getCardNavListSnapshot, getCardNavListSnapshot)

  const [current, setCurrent] = useState<CardIdentity | null>(() => {
    const parsed = parseCardPathParams(game, language)
    return parsed ? { game: parsed.game, language: parsed.language, externalId } : null
  })

  const index = current
    ? cards.findIndex(
        (c) => c.game === current.game && c.language === current.language && c.externalId === current.externalId,
      )
    : -1
  const card = index >= 0 ? cards[index] : null

  useEffect(() => {
    // store-miss 落真實頁的兜底，**只在 store 確實有列表卻找不到此卡**時觸發（path 非法、或此卡被篩掉/
    // 過期 URL）。⚠️ 刻意不在 store 為空（cards.length===0）時 reload——那可能只是 refetch 瞬間或
    // dev 首幀空快照，此時應保持 null、等 useSyncExternalStore 訂閱回填後自然顯示 drawer。
    // 先前寫成 `if (!card) reload` 會在 store 短暫為空時誤觸重載 → 落到真實整頁（= 點卡開成獨立頁的回歸）。
    // 獨立頁點同系列卡改走原生 <a>（hard nav），本就不會進到這裡，故無需靠此 reload 兜底那條路徑。
    if (!current || (cards.length > 0 && index === -1)) window.location.reload()
  }, [current, cards.length, index])

  if (!card) return null

  const handleClose = () => router.back()

  const handleNavigate = (newIndex: number) => {
    const target = cards[newIndex]
    if (!target) return
    window.history.replaceState(null, '', cardPath(target))
    setCurrent({ game: target.game, language: target.language, externalId: target.externalId })
  }

  const handleAddToBinder = async (binderId: string, status: CardStatus, quantity: number) => {
    await addToBinder.mutateAsync({ card, binderId, status, quantity })
  }

  // ⚠️ 刻意用硬導航（window.location.href），不透過 next/navigation 的 router.push/back：
  // 實測發現 forward push 無法可靠讓 @modal 這個攔截 slot 落回 default.tsx（沿用舊渲染內容，
  // drawer 殘留不關閉）；改用 router.back() 關閉 + 背景 CardSearchClient 端另行 push 篩選，
  // 兩者非同步時序會互相競態覆蓋（曾實測 setId 被 back() 蓋掉、篩選憑空消失）。硬導航是
  // 唯一能一次到位、零競態的做法：整頁重新載入必然重置 @modal，此為刻意的一次性導航，
  // 非頻繁互動，接受失去 SPA 平滑轉場的代價換取正確性。
  const handleSeriesClick = () => {
    const params = new URLSearchParams()
    params.set('game', card.game)
    params.set('language', card.language)
    params.set('setId', card.set.id)
    window.location.href = `/cards?${params.toString()}`
  }

  return (
    <CardDetailDrawer
      card={card}
      open
      onClose={handleClose}
      onAddToBinder={handleAddToBinder}
      onLoginSuccess={() => qc.invalidateQueries({ queryKey: queryKeys.cards.all })}
      cards={cards}
      currentIndex={index}
      onNavigate={handleNavigate}
      onSeriesClick={handleSeriesClick}
    />
  )
}
