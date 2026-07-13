import { describe, it, expect } from 'vitest'
import { resolveCardDisplayImage } from '../resolve-card-image'

describe('resolveCardDisplayImage', () => {
  it('一般卡（isCollectible=true）取自身圖', () => {
    const result = resolveCardDisplayImage({
      isCollectible: true,
      imageSmall: 'https://example.com/small.png',
      imageLarge: 'https://example.com/large.png',
      canonicalCard: null,
    })
    expect(result).toEqual({ large: 'https://example.com/large.png', small: 'https://example.com/small.png' })
  })

  it('OPCG ZH_TW alias 卡（isCollectible=false + canonicalCard）取 canonical 圖', () => {
    const result = resolveCardDisplayImage({
      isCollectible: false,
      imageSmall: '',
      imageLarge: '',
      canonicalCard: {
        imageSmall: 'https://www.onepiece-cardgame.com/small.png',
        imageLarge: 'https://www.onepiece-cardgame.com/large.png',
      },
    })
    expect(result.large).toContain('proxy-image')
    expect(result.small).toContain('proxy-image')
  })

  it('54 張台灣限定卡（isCollectible=true, canonicalCardId=null → canonicalCard undefined）取自身圖', () => {
    const result = resolveCardDisplayImage({
      isCollectible: true,
      imageSmall: 'https://example.com/tw-small.png',
      imageLarge: 'https://example.com/tw-large.png',
      canonicalCard: null,
    })
    expect(result).toEqual({
      large: 'https://example.com/tw-large.png',
      small: 'https://example.com/tw-small.png',
    })
  })

  it('alias 卡但無 canonicalCard（資料異常兜底）取自身（空）圖', () => {
    const result = resolveCardDisplayImage({
      isCollectible: false,
      imageSmall: '',
      imageLarge: '',
      canonicalCard: null,
    })
    expect(result).toEqual({ large: '', small: '' })
  })
})
