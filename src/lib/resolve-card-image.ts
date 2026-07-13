import { getCardImageUrl } from '@/lib/get-card-image-url'

type CardForImage = {
  isCollectible: boolean
  imageSmall: string
  imageLarge: string
  canonicalCard?: { imageSmall: string; imageLarge: string } | null
}

/**
 * OPCG ZH_TW alias 卡（isCollectible=false，無實體印刷圖）一律取 canonical（JA）圖；
 * 其餘卡（含 54 張 canonicalCardId=null 的台灣限定卡）取自身圖。
 * 從 card-detail-drawer.tsx 抽出，供 drawer / standalone page / same-set 區塊共用，避免各自複製漂移。
 */
export function resolveCardDisplayImage(card: CardForImage): { large: string; small: string } {
  const source = !card.isCollectible && card.canonicalCard ? card.canonicalCard : card
  return {
    large: getCardImageUrl(source.imageLarge) || getCardImageUrl(source.imageSmall) || '',
    small: getCardImageUrl(source.imageSmall) || getCardImageUrl(source.imageLarge) || '',
  }
}
