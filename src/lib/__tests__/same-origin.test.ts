import { describe, it, expect } from 'vitest'
import { isCrossOriginHotlink } from '@/lib/same-origin'

const SITE_ORIGIN = 'https://pocketbindr.app'

describe('isCrossOriginHotlink', () => {
  it('缺 referer 與 origin → false（放行 Googlebot 等無 Referer 的爬蟲）', () => {
    expect(isCrossOriginHotlink(null, null, SITE_ORIGIN)).toBe(false)
  })

  it('same-origin referer（含路徑）→ false', () => {
    expect(isCrossOriginHotlink(`${SITE_ORIGIN}/cards`, null, SITE_ORIGIN)).toBe(false)
  })

  it('cross-origin referer（外站）→ true', () => {
    expect(isCrossOriginHotlink('https://evil.example.com/page', null, SITE_ORIGIN)).toBe(true)
  })

  it('origin 優先於 referer 判斷：origin same-site 但 referer 為外站 → false', () => {
    expect(isCrossOriginHotlink('https://evil.example.com', SITE_ORIGIN, SITE_ORIGIN)).toBe(false)
  })

  it('origin 優先於 referer 判斷：origin 為外站但 referer same-site → true', () => {
    expect(isCrossOriginHotlink(`${SITE_ORIGIN}/cards`, 'https://evil.example.com', SITE_ORIGIN)).toBe(true)
  })

  it('malformed 來源字串 → false（fail-open，不因解析失敗誤擋）', () => {
    expect(isCrossOriginHotlink('not a url', null, SITE_ORIGIN)).toBe(false)
  })
})
