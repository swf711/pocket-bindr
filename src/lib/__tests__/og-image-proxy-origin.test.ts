import { describe, it, expect } from 'vitest'

// 獨立測試檔：og.ts 的 IMAGE_PROXY_ORIGIN 於模組載入時讀取 NEXT_PUBLIC_IMAGE_PROXY_ORIGIN，
// 需在 import 前 stub，與 og.test.ts（未設定 env，測 /api/proxy-image fallback 分支）分檔隔離。
vi.stubEnv('NEXT_PUBLIC_IMAGE_PROXY_ORIGIN', 'https://images.pocketbindr.app')

const { resolveOgImageFetch } = await import('../og')

describe('resolveOgImageFetch (NEXT_PUBLIC_IMAGE_PROXY_ORIGIN set)', () => {
  it('Cloudflare Worker URL 還原成官網 upstream URL 並補上 Referer', () => {
    const upstream = 'https://www.onepiece-cardgame.com/images/cardlist/card/OP16-001.png'
    const result = resolveOgImageFetch(`https://images.pocketbindr.app?url=${encodeURIComponent(upstream)}`)
    expect(result).toEqual({ url: upstream, headers: { Referer: 'https://www.onepiece-cardgame.com' } })
  })

  it('Worker URL 指向非官網 host（pokemontcg.io）還原後不補 Referer', () => {
    const upstream = 'https://images.pokemontcg.io/sv3/25.png'
    const result = resolveOgImageFetch(`https://images.pocketbindr.app?url=${encodeURIComponent(upstream)}`)
    expect(result).toEqual({ url: upstream, headers: {} })
  })

  it('Worker URL 缺少 url 參數回 null', () => {
    expect(resolveOgImageFetch('https://images.pocketbindr.app')).toBeNull()
  })

  it('舊 /api/proxy-image 相對路徑仍可還原（過渡期相容，非 Worker URL）', () => {
    const upstream = 'https://images.pokemontcg.io/sv3/25.png'
    const result = resolveOgImageFetch(`/api/proxy-image?url=${encodeURIComponent(upstream)}`)
    expect(result).toEqual({ url: upstream, headers: {} })
  })
})
