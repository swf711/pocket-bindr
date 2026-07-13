import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { resolveCardDisplayImage } from '@/lib/resolve-card-image'
import { cardPath } from '@/lib/card-url'
import { CardStandaloneInteractive } from '@/components/cards/card-standalone-interactive'
import { CardTiltImage } from '@/components/cards/card-tilt-image'
import { CardBreadcrumb } from '@/components/cards/card-breadcrumb'
import type { PublicCardRow, SameSetCardRow } from '@/lib/public-card'
import type { CardBreadcrumbItem } from '@/lib/card-jsonld'

interface CardStandaloneViewProps {
  card: PublicCardRow
  sameSetCards: SameSetCardRow[]
  breadcrumbItems: CardBreadcrumbItem[]
}

/**
 * 卡片獨立 SEO 頁的全頁版面（非 Drawer）。上下兩 block：
 * 上方＝大卡圖（左，含 hover 傾斜）+ 窄操作欄（右，比照 Drawer 大卡圖/窄操作比例）；
 * 下方＝同系列其他卡（滿寬）。欄位比照 CardDetailDrawer 的 infoBlock，純 server render 以利爬蟲索引；
 * user-specific 部分交給 CardStandaloneInteractive。
 */
export async function CardStandaloneView({ card, sameSetCards, breadcrumbItems }: CardStandaloneViewProps) {
  const t = await getTranslations('cardDetail')
  const tStandalone = await getTranslations('cardStandalone')
  const image = resolveCardDisplayImage(card)

  return (
    <div className="flex flex-col gap-10">
      <CardBreadcrumb items={breadcrumbItems} />

      {/* 上方 block：大卡圖（左）+ 窄操作欄（右），整組於容器內置中 */}
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-center md:gap-10">
        <div className="mx-auto w-full max-w-xs sm:max-w-sm md:mx-0 md:max-w-md md:shrink-0">
          {image.large ? (
            <CardTiltImage src={image.large} alt={card.name} className="w-full max-w-sm md:max-w-md" />
          ) : (
            <div className="flex aspect-2.5/3.5 w-full max-w-sm items-center justify-center rounded-lg bg-muted text-muted-foreground md:max-w-md">
              {card.name}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-6 md:w-80 md:shrink-0">
          <div>
            <h1 className="text-2xl font-bold">{card.name}</h1>
            <p className="text-muted-foreground">
              {card.set.name} <span className="text-xs">{card.set.externalId}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{t('cardNumber')}</span>
              <span>{card.cardNumber}</span>
            </div>

            {card.set.releaseDate && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{t('releaseDate')}</span>
                {/* unstable_cache 內部以 JSON 序列化快取回傳值，Date 欄位在 cache hit 時會是字串，
                    cache miss 時仍是 Date 物件——以 new Date() 統一吸收兩種型態。 */}
                <span>{new Date(card.set.releaseDate).toISOString().slice(0, 10)}</span>
              </div>
            )}

            {card.rarity && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{t('rarity')}</span>
                <span><Badge className="bg-tertiary-container text-on-tertiary-container">{card.rarity}</Badge></span>
              </div>
            )}

            {card.hp != null && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">HP</span>
                <span><Badge className="bg-tertiary-container text-on-tertiary-container">{card.hp}</Badge></span>
              </div>
            )}

            {card.types.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{t('types')}</span>
                <span className="flex flex-wrap gap-1">
                  {card.types.map((type) => (
                    <Badge key={type} className="bg-tertiary-container text-on-tertiary-container">{type}</Badge>
                  ))}
                </span>
              </div>
            )}
          </div>

          <CardStandaloneInteractive cardId={card.id} />
        </div>
      </div>

      {/* 下方 block：同系列其他卡（滿寬） */}
      {sameSetCards.length > 0 && (
        <div className="flex flex-col gap-3 border-t pt-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">{tStandalone('sameSetTitle')}</h2>
            <Button asChild variant="outline" size="lg">
              <Link href={`/cards?game=${card.game}&language=${card.language}&setId=${card.set.id}`}>
                {tStandalone('viewAllInSet')}
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {sameSetCards.map((sc) => {
              const scImage = resolveCardDisplayImage(sc)
              return (
                // 原生 <a>（非 next/link）：獨立頁點同系列卡屬「離開此卡脈絡、無列表 prev/next 語意」，
                // 需完整頁面導航直接落到目標真實頁；用 <Link> 會被 @modal 攔截、但獨立頁 card-nav-store 為空
                // → 渲染靜默空 modal（需點兩次的 bug 根因）。native <a href> 對爬蟲同等友善，繞開攔截。
                <a
                  key={sc.id}
                  href={cardPath(sc)}
                  className="group relative aspect-2.5/3.5 overflow-hidden rounded-lg shadow-sm transition-transform hover:scale-105"
                >
                  {scImage.small ? (
                    <img
                      src={scImage.small}
                      alt={sc.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted p-1 text-center text-xs text-muted-foreground">
                      {sc.name}
                    </div>
                  )}
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
