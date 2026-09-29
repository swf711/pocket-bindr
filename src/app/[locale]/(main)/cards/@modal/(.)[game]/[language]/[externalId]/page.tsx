import { notFound } from 'next/navigation'
import { CardModalClient } from '@/components/cards/card-modal-client'
import { parseCardRouteParams } from '@/lib/card-url'

type PageParams = { game: string; language: string; externalId: string }

// On-demand ISR, same reasoning as the standalone card page: this route renders no
// request-scoped data (params in, client component out — the card itself comes from the
// in-memory card-nav-store), so every response is shareable. Without the empty
// generateStaticParams Next renders the dynamic segments per request, and since every
// <Link> in the /cards grid prefetches this route, that was the single largest source of
// function invocations. Prefetch behaviour is unchanged — it now lands on the CDN.
// 🔴 Must be a literal (build-time analysis); kept equal to the standalone page (unit-tested).
export const revalidate = 86400

export function generateStaticParams() {
  return []
}

export default async function CardModalPage({ params }: { params: Promise<PageParams> }) {
  const { game, language, externalId } = await params
  // 參數驗證先於一切：不合法的 game/language/externalId 直接 404，不為垃圾網址產生新的 ISR
  // 快取條目（此路由的 key 空間原本無界，見 2026-09-29 discuss-feature 盤點）。
  const parsed = parseCardRouteParams(game, language, externalId)
  if (!parsed) notFound()

  // key 綁定路由三元組：只在「真正的路由跳轉」（初次開啟／點擊背景列表另一張卡）變動，
  // 強制 remount 取得新起點；prev/next 走 history.replaceState 不觸發此重渲染（見 card-modal-client.tsx）。
  // game/language 沿用原始 path 段（已通過驗證、與 parsed.game/language 等價），externalId 取
  // 驗證函式解碼後的值。
  return (
    <CardModalClient
      key={`${game}/${language}/${parsed.externalId}`}
      game={game}
      language={language}
      externalId={parsed.externalId}
    />
  )
}
