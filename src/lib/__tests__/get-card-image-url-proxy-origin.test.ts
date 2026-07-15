import { describe, it, expect } from 'vitest'

// 獨立測試檔：NEXT_PUBLIC_IMAGE_PROXY_ORIGIN 於模組載入時讀取（Next.js inline 慣例，
// 見 get-card-image-url.ts 頂部註解），故需在 import 前 stub，與 get-card-image-url.test.ts
// 的「未設定 env」情境（既有測試，走 /api/proxy-image fallback）分檔隔離，避免互相污染。
vi.stubEnv('NEXT_PUBLIC_IMAGE_PROXY_ORIGIN', 'https://images.pocketbindr.app')

const { getCardImageUrl } = await import('../get-card-image-url')

describe('getCardImageUrl (NEXT_PUBLIC_IMAGE_PROXY_ORIGIN set)', () => {
  it('OPCG hotlink 圖改指向 Cloudflare Worker，非 /api/proxy-image', () => {
    const input = 'https://www.onepiece-cardgame.com/images/cardlist/card/OP16-001.png'
    expect(getCardImageUrl(input)).toBe(
      `https://images.pocketbindr.app?url=${encodeURIComponent(input)}`,
    )
  })

  it('PTCG hotlink 圖改指向 Cloudflare Worker', () => {
    const input = 'https://asia.pokemon-card.com/images/card/en/card_SWSH1_001_en.jpg'
    expect(getCardImageUrl(input)).toBe(
      `https://images.pocketbindr.app?url=${encodeURIComponent(input)}`,
    )
  })

  it('非 proxy host（Supabase/pokemontcg.io）仍原樣直連，不受影響', () => {
    const input = 'https://images.pokemontcg.io/sv6/1.png'
    expect(getCardImageUrl(input)).toBe(input)
  })
})
