import { describe, it, expect } from 'vitest'
import { resolveCollectionCardId } from '../resolve-card-id'

describe('resolveCollectionCardId', () => {
  it('OPCG ZH_TW alias 卡（isCollectible=false）→ 回傳 canonicalCardId', () => {
    const card = { id: 'zh-tw-001', isCollectible: false, canonicalCardId: 'ja-001' }
    expect(resolveCollectionCardId(card)).toBe('ja-001')
  })

  it('台灣限定卡（isCollectible=true, canonicalCardId=null）→ 回傳自身 id', () => {
    const card = { id: 'zh-tw-limited-001', isCollectible: true, canonicalCardId: null }
    expect(resolveCollectionCardId(card)).toBe('zh-tw-limited-001')
  })

  it('通常卡（isCollectible=true, canonicalCardId=null）→ 回傳自身 id', () => {
    const card = { id: 'en-001', isCollectible: true, canonicalCardId: null }
    expect(resolveCollectionCardId(card)).toBe('en-001')
  })

  it('canonicalCardId が空文字列でない場合は canonicalCardId を優先', () => {
    const card = { id: 'en-001', isCollectible: true, canonicalCardId: 'ja-001' }
    expect(resolveCollectionCardId(card)).toBe('ja-001')
  })
})
