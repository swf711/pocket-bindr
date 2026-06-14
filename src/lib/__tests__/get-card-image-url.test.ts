import { describe, it, expect } from 'vitest'
import { getCardImageUrl } from '../get-card-image-url'

describe('getCardImageUrl', () => {
  it('returns proxy URL for OPCG ZH_TW source', () => {
    const input = 'https://asia-tc.onepiece-cardgame.com/images/cardlist/card/OP15-001.png'
    expect(getCardImageUrl(input)).toBe(`/api/proxy-image?url=${encodeURIComponent(input)}`)
  })

  it('returns proxy URL for OPCG JA source', () => {
    const input = 'https://www.onepiece-cardgame.com/images/cardlist/card/OP16-001.png'
    expect(getCardImageUrl(input)).toBe(`/api/proxy-image?url=${encodeURIComponent(input)}`)
  })

  it('returns proxy URL for OPCG EN source', () => {
    const input = 'https://en.onepiece-cardgame.com/images/cardlist/card/OP16-001.png'
    expect(getCardImageUrl(input)).toBe(`/api/proxy-image?url=${encodeURIComponent(input)}`)
  })

  it('returns proxy URL for PTCG ZH_TW source', () => {
    const input = 'https://asia.pokemon-card.com/images/card/en/card_SWSH1_001_en.jpg'
    expect(getCardImageUrl(input)).toBe(`/api/proxy-image?url=${encodeURIComponent(input)}`)
  })

  it('returns proxy URL for PTCG JA source', () => {
    const input = 'https://www.pokemon-card.com/assets/images/card_images/large/SV1/001.jpg'
    expect(getCardImageUrl(input)).toBe(`/api/proxy-image?url=${encodeURIComponent(input)}`)
  })

  it('returns original URL for pokemontcg.io (no proxy needed)', () => {
    const input = 'https://images.pokemontcg.io/sv6/1.png'
    expect(getCardImageUrl(input)).toBe(input)
  })

  it('returns null for null', () => {
    expect(getCardImageUrl(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(getCardImageUrl(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getCardImageUrl('')).toBeNull()
  })

  it('returns original string for malformed URL', () => {
    expect(getCardImageUrl('not-a-url')).toBe('not-a-url')
  })

  it('returns self-hosted Supabase Storage URL as-is (not proxied)', () => {
    const input = 'https://abcdefgh.supabase.co/storage/v1/object/public/card-images/ja/neo1/001.webp'
    expect(getCardImageUrl(input)).toBe(input)
  })
})
