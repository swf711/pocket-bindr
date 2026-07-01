import { describe, it, expect } from 'vitest'
import { expandPokemonNameTerms, POKEMON_NAMES } from '../pokemon-name-dictionary'

describe('expandPokemonNameTerms', () => {
  it('繁中物種名完整匹配 → 展開為 JA 物種名（皮卡丘 → ピカチュウ）', () => {
    expect(expandPokemonNameTerms('皮卡丘', 'JA')).toEqual([POKEMON_NAMES[25].ja])
  })

  it('繁中 → EN（皮卡丘 → Pikachu）', () => {
    expect(expandPokemonNameTerms('皮卡丘', 'EN')).toEqual([POKEMON_NAMES[25].en])
  })

  it('目標語言與輸入同語言（大小寫不同）時不重複展開', () => {
    expect(expandPokemonNameTerms('pikachu', 'EN')).toEqual([])
  })

  it('非完整物種名（皮卡）回 []，退回字面搜尋', () => {
    expect(expandPokemonNameTerms('皮卡', 'JA')).toEqual([])
  })

  it('非物種關鍵字（如 "VMAX"）回 []', () => {
    expect(expandPokemonNameTerms('VMAX', 'JA')).toEqual([])
  })

  it('未知語言（非 EN/JA/ZH_TW）回 []', () => {
    expect(expandPokemonNameTerms('皮卡丘', 'FR' as never)).toEqual([])
  })
})
