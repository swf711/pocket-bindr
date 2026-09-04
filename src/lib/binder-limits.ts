export const MAX_BINDERS_PER_USER = 3
export const MAX_PAGES_PER_BINDER = 100
export const MAX_BATCH_CARDS = 60
/** 單一格位可掛的標籤數上限。再多在最窄格位會超過兩行、吃掉卡圖。 */
export const MAX_SLOT_LABELS = 3
/** 單一標籤字數上限。刻意短：最窄的格位（iPad 直向 ~124px）要能一行並排放下兩顆 badge。 */
export const MAX_SLOT_LABEL_LENGTH = 8
