import { describe, it, expect } from 'vitest'
import { getSearchExample, getSearchExampleName } from '../search-example'
import { parseSetCardQuery } from '../parse-set-card-query'

describe('getSearchExample', () => {
  it('PTCG ZH_TW → MJF 008/022（皮卡丘ex，已對照 DB 實卡驗證）', () => {
    expect(getSearchExample('PTCG', 'ZH_TW')).toBe('MJF 008/022')
  })

  it('PTCG EN → me2pt5 55（Pikachu，已對照 DB 實卡驗證）', () => {
    expect(getSearchExample('PTCG', 'EN')).toBe('me2pt5 55')
  })

  it('PTCG JA → MP1 006/023（ピカチュウex，已對照 DB 實卡驗證）', () => {
    expect(getSearchExample('PTCG', 'JA')).toBe('MP1 006/023')
  })

  it('OPCG 三語皆 → OP16-015（同碼、無語言相依落差）', () => {
    expect(getSearchExample('OPCG', 'ZH_TW')).toBe('OP16-015')
    expect(getSearchExample('OPCG', 'EN')).toBe('OP16-015')
    expect(getSearchExample('OPCG', 'JA')).toBe('OP16-015')
  })

  it('每個範例字串皆可被 parseSetCardQuery 解析為合法型號查詢', () => {
    const examples = [
      getSearchExample('PTCG', 'ZH_TW'),
      getSearchExample('PTCG', 'EN'),
      getSearchExample('PTCG', 'JA'),
      getSearchExample('OPCG', 'ZH_TW'),
    ]
    for (const example of examples) {
      expect(parseSetCardQuery(example)).not.toBeNull()
    }
  })
})

describe('getSearchExampleName', () => {
  it('回傳的名稱對應範例卡（與 getSearchExample 查詢字串同源）', () => {
    expect(getSearchExampleName('PTCG', 'ZH_TW')).toBe('皮卡丘ex')
    expect(getSearchExampleName('PTCG', 'EN')).toBe('Pikachu')
    expect(getSearchExampleName('PTCG', 'JA')).toBe('ピカチュウex')
    expect(getSearchExampleName('OPCG', 'ZH_TW')).toBe('魯夫')
    expect(getSearchExampleName('OPCG', 'EN')).toBe('Luffy')
    expect(getSearchExampleName('OPCG', 'JA')).toBe('ルフィ')
  })
})
