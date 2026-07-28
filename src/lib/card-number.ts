/**
 * 卡號字串的**結構**單一真相：抽取、組裝、拆解、判定。
 *
 * 與 `card-display.ts` 的分工：後者管「有沒有卡號 / 怎麼排序 / 怎麼組標籤」（呈現層），
 * 本檔管「卡號字串本身由哪些成分組成」（結構層）。爬蟲（scripts/）與搜尋端共用同一份規則，
 * 避免「寫入時用一套分隔符、查詢時用另一套」的漂移。
 *
 * ## 為何需要「多成分」卡號
 * 部分 PTCG 卡是**複數卡**：一個官方 detail 頁 = 一組實體多張卡，卡面各印不同收集編號。
 * 例：`ホウオウLEGEND`（上/下 兩張）、`ピカチュウV-UNION`（四張）、`伝説の海溝`（左/右 兩張）。
 * 日/繁中官網把它建模成「單一 detail 頁 + 單張合成圖」，我方沿用（1 張 DB Card = 1 組實體多卡），
 * 故單一 `cardNumber` 欄位需承載多個號碼，以 `・` 分隔。
 */

/** 多卡號之間的分隔符。寫入（爬蟲/backfill）與查詢（搜尋）必須共用此常數。 */
export const CARD_NUMBER_SEPARATOR = '・'

/**
 * 卡號成分：`分子/分母`。
 *
 * 分母**不能只收數字**——JA 促銷卡的分母是系列碼（`001/SV-P`、`123/SM-P`），
 * 只收數字會讓這些卡在爬蟲端抽不到號碼而退化成空字串。
 */
const NUMBER_COMPONENT = /(\d{1,3})\s*\/\s*([A-Za-z0-9-]{1,8})/g

/**
 * 從官網 detail 頁的原始文字抽出所有卡號成分。
 *
 * ⚠️ 呼叫端必須餵**未剝除空白**的原始文字。已剝空白的串接形（`001/013002/013`）無成分邊界，
 * regex 會把 `013002` 當成分母而誤切。
 *
 * 去重保序（同一號碼在頁面出現兩次只留一個，順序依首次出現）。
 */
export function extractCardNumbers(rawText: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of rawText.matchAll(NUMBER_COMPONENT)) {
    const value = `${m[1]}/${m[2]}`
    if (seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

/** 卡號成分陣列 → DB 儲存值。單一成分時輸出與成分本身逐字元相同（單號卡零回歸的關鍵）。 */
export function formatCardNumbers(numbers: string[]): string {
  return numbers.join(CARD_NUMBER_SEPARATOR)
}

/** DB 儲存值 → 卡號成分陣列。空值回空陣列（空字串是 authentic 的「無卡號」，見 card-display.ts）。 */
export function splitCardNumber(cardNumber: string | null | undefined): string[] {
  if (!cardNumber) return []
  return cardNumber
    .split(CARD_NUMBER_SEPARATOR)
    .map(part => part.trim())
    .filter(Boolean)
}

/**
 * 是否為複數卡（一列 DB 資料代表多張實體卡）。
 *
 * 唯一判定來源＝卡號成分數 > 1，零 schema、零旗標欄位。消費端用途：複數卡的官方卡圖是
 * **合成圖**（LEGEND 上下疊、V-UNION 2×2、M6 スタジアム 左右並排），比例與標準卡不同，
 * 套 `object-cover` 會被裁成中央一條，需改 `object-contain`。
 */
export function isMultiNumberCard(cardNumber: string | null | undefined): boolean {
  return splitCardNumber(cardNumber).length > 1
}
