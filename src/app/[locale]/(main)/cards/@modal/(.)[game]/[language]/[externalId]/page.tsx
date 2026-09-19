import { CardModalClient } from '@/components/cards/card-modal-client'

type PageParams = { game: string; language: string; externalId: string }

export default async function CardModalPage({ params }: { params: Promise<PageParams> }) {
  const { game, language, externalId } = await params
  const decoded = decodeURIComponent(externalId)
  // key 綁定路由三元組：只在「真正的路由跳轉」（初次開啟／點擊背景列表另一張卡）變動，
  // 強制 remount 取得新起點；prev/next 走 history.replaceState 不觸發此重渲染（見 card-modal-client.tsx）。
  return <CardModalClient key={`${game}/${language}/${decoded}`} game={game} language={language} externalId={decoded} />
}
