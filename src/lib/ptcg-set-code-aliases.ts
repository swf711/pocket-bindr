import type { Game, Language } from '@prisma/client'
import { PTCG_EN_PTCGO_CODE_ALIASES } from './ptcg-en-ptcgo-aliases.generated'

/**
 * 卡面印刷的 set 碼 → DB `CardSet.externalId` 候選清單（搜尋用；語言/遊戲相依）。
 *
 * 卡圖盤點（見 docs/DATA_SOURCES.md）確立的落差：
 * - **PTCG ZH_TW**：繁體中文（台灣）版卡面碼 = `{externalId}` + 區域後綴 `F`
 *   （劍盾世代起全版通用：`m5`→卡面 `M5F`、`sv8`→`sv8F`、真實 set `svf`→`svFF`）。
 *   太陽月亮世代**無**此後綴，但其 externalId 皆不以 `f` 結尾，故剝尾規則對其天然為 no-op。
 *   → 尾 `f` 者展開為 [剝尾, 原碼]；保留原碼避免使用者直接輸入真實 set code（如 `svf`）被剝成不存在碼而漏搜。
 * - **PTCG EN**：卡面印三碼縮寫（pokemontcg.io `ptcgoCode`，如 `OBF`），與 externalId（`sv3`）無規則關係
 *   → 查對照表 PTCG_EN_PTCGO_CODE_ALIASES（一碼可對多候選：主 set + Trainer Gallery/子集）。
 * - **PTCG JA**：卡面碼 = externalId，無落差 → 原碼。
 *
 * 回傳一律 lowercase、去重；externalId 比對為大小寫不敏感。非 PTCG（如 OPCG）一律回原碼、不套任何規則。
 */
export function resolvePtcgSetCodeCandidates(
  setCode: string,
  game?: Game | null,
  language?: Language | null,
): string[] {
  const code = setCode.toLowerCase()
  if (game !== 'PTCG') return [code]

  if (language === 'ZH_TW') {
    if (code.length > 1 && code.endsWith('f')) return [code.slice(0, -1), code]
    return [code]
  }

  if (language === 'EN') {
    return PTCG_EN_PTCGO_CODE_ALIASES[code] ?? [code]
  }

  return [code]
}
