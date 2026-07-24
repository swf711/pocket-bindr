'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { CardWithCollectionStatus } from '@/types/card'
import { getCardImageUrl } from '@/lib/get-card-image-url'
import { CardImage } from './card-image'
import { cn } from '@/lib/utils'

interface CardItemProps {
  card: CardWithCollectionStatus
  onClick: (card: CardWithCollectionStatus) => void
  href?: string
  /** 為真時進入多選模式：點擊改為勾選（攔下 <Link> 導航，不觸發攔截 modal）。 */
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (card: CardWithCollectionStatus) => void
}

const cardItemBase =
  'group relative aspect-2.5/3.5 w-full overflow-hidden rounded-lg cursor-pointer shadow-sm ' +
  'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function CardItem({ card, onClick, href, selectable, selected, onToggleSelect }: CardItemProps) {
  const t = useTranslations('cards')
  const displayImageSmall = !card.isCollectible && card.canonicalCard
    ? card.canonicalCard.imageSmall
    : card.imageSmall
  const resolvedImageUrl = getCardImageUrl(displayImageSmall)

  // 圖片/fallback 一律 `absolute inset-0` 脫離文件流：out-of-flow 的內容無法影響 aspect-ratio box 的
  // 內在高度，故外框高度純由 `aspect-2.5/3.5` 決定——這是 iOS Safari「aspect-ratio + object-cover 卡圖
  // 被放大裁切」整族 bug 的通解，與 <a>／<button> 元素型別無關（脫流後皆正確）。containing block 為
  // 最近的 positioned 祖先（Link 分支＝relative wrapper、button 分支＝relative 的 cardItemBase）。
  const cardImage = (
    <CardImage
      src={resolvedImageUrl}
      alt={card.name}
      className="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
      fallback={
        <div
          data-testid="card-image-fallback"
          className="absolute inset-0 flex h-full w-full flex-col items-center
                     justify-center bg-muted text-muted-foreground"
        >
          <span className="text-xs">{card.name}</span>
          <span className="text-xs">{t('noImage')}</span>
        </div>
      }
    />
  )

  // 勾選指示圈（左上）＋ 內層卡圖縮小的 wrapper——採 Google 相簿式：外層 tile 尺寸不變，
  // 僅內層卡圖 selected 時往內縮小（帶 transition），露出一圈 bg-muted 間隙。無 selected 選取框。
  const selectIndicator = selectable && (
    <div
      data-testid="card-item-select-indicator"
      className={cn(
        'absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-white bg-black/30',
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" />}
    </div>
  )

  // href 分支（搜尋頁）：**兩種模式都維持 <Link>**（多選時 onClick preventDefault 攔下導航改勾選），
  // 避免切換模式時元件型別 Link↔button 改變導致整批卡圖重掛/重載。卡圖固定包在同一 scale wrapper，
  // React 只更新 class、不重掛。
  if (href) {
    return (
      <Link
        href={href}
        data-testid="card-item"
        {...(selectable ? { 'data-selected': selected, 'aria-pressed': selected } : {})}
        onClick={selectable ? (e) => { e.preventDefault(); onToggleSelect?.(card) } : undefined}
        className={cn(
          cardItemBase,
          selectable ? 'bg-muted' : 'hover:scale-105 hover:shadow-lg',
        )}
      >
        <div
          className={cn(
            'relative h-full w-full overflow-hidden transition-transform duration-150',
            selected && 'scale-[0.9] rounded-md',
          )}
        >
          {cardImage}
        </div>
        {selectIndicator}
      </Link>
    )
  }

  // 無 href（binder/public/collection 三處）：維持既有 button + onClick，行為零變。
  // 卡圖已 `absolute inset-0`（見 cardImage 定義），button 內無 in-flow 內容 → aspect-ratio 生效；
  // `appearance-none` 一併剝除 <button> 原生外觀的內在尺寸，雙保險確保 iOS Safari 不塌陷放大。
  return (
    <button
      onClick={() => onClick(card)}
      data-testid="card-item"
      className={cn(cardItemBase, 'appearance-none hover:scale-105 hover:shadow-lg')}
    >
      {cardImage}
    </button>
  )
}
