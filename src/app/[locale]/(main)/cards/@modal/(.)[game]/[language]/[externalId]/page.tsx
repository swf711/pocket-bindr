import { CardModalClient } from '@/components/cards/card-modal-client'

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
  const decoded = decodeURIComponent(externalId)
  // key 綁定路由三元組：只在「真正的路由跳轉」（初次開啟／點擊背景列表另一張卡）變動，
  // 強制 remount 取得新起點；prev/next 走 history.replaceState 不觸發此重渲染（見 card-modal-client.tsx）。
  return <CardModalClient key={`${game}/${language}/${decoded}`} game={game} language={language} externalId={decoded} />
}
