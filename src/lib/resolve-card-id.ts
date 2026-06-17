export function resolveCollectionCardId(card: {
  id: string
  isCollectible: boolean
  canonicalCardId: string | null
}): string {
  // OPCG ZH_TW alias 卡（isCollectible=false）→ 用 JA 的 canonicalCardId
  // 台灣限定卡（isCollectible=true, canonicalCardId=null）→ 用自身 id
  return card.canonicalCardId ?? card.id
}
