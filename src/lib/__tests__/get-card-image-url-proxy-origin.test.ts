import { describe, it, expect } from 'vitest'

// 混合架構測試：NEXT_PUBLIC_IMAGE_PROXY_ORIGIN + NEXT_PUBLIC_IMAGE_PROXY_WORKER_HOSTS 於模組載入時
// 讀取（Next.js inline 慣例，見 get-card-image-url.ts 頂部註解），需在 import 前 stub。
// 與 get-card-image-url.test.ts 的「未設定 env」情境（全部走 /api/proxy-image）分檔隔離。
vi.stubEnv('NEXT_PUBLIC_IMAGE_PROXY_ORIGIN', 'https://images.pocketbindr.app')
vi.stubEnv('NEXT_PUBLIC_IMAGE_PROXY_WORKER_HOSTS', 'www.pokemon-card.com,asia.pokemon-card.com')

const { getCardImageUrl } = await import('../get-card-image-url')

describe('getCardImageUrl 混合分流（Worker origin + WORKER_HOSTS 白名單）', () => {
  it('proxy host 且在 WORKER_HOSTS 白名單內 → 走 Cloudflare Worker', () => {
    const input = 'https://asia.pokemon-card.com/tw/card-img/tw00019291.png'
    expect(getCardImageUrl(input)).toBe(
      `https://images.pocketbindr.app?url=${encodeURIComponent(input)}`,
    )
  })

  it('另一個白名單內的 proxy host → 走 Cloudflare Worker', () => {
    const input = 'https://www.pokemon-card.com/assets/images/card_images/large/SV1/001.jpg'
    expect(getCardImageUrl(input)).toBe(
      `https://images.pocketbindr.app?url=${encodeURIComponent(input)}`,
    )
  })

  it('proxy host 但不在白名單 → 回退 /api/proxy-image，不走 Worker', () => {
    const input = 'https://www.onepiece-cardgame.com/images/cardlist/card/OP16-001.png'
    expect(getCardImageUrl(input)).toBe(`/api/proxy-image?url=${encodeURIComponent(input)}`)
  })

  it('另一個不在白名單的 proxy host → 回退 /api/proxy-image', () => {
    const input = 'https://asia-tc.onepiece-cardgame.com/images/cardlist/card/OP15-001.png'
    expect(getCardImageUrl(input)).toBe(`/api/proxy-image?url=${encodeURIComponent(input)}`)
  })

  it('非 proxy host（Supabase/pokemontcg.io）仍原樣直連，不受影響', () => {
    const input = 'https://images.pokemontcg.io/sv6/1.png'
    expect(getCardImageUrl(input)).toBe(input)
  })
})
