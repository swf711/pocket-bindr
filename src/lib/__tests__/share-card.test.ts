import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildCardShareUrl, shareOrCopy } from '@/lib/share-card'

const ORIGIN = 'https://pocketbindr.app'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildCardShareUrl', () => {
  it('PTCG EN 卡組出 /cards/ptcg/en/{externalId}', () => {
    const url = buildCardShareUrl({ game: 'PTCG', language: 'EN', externalId: 'sv3-125' }, ORIGIN)
    expect(url).toBe('https://pocketbindr.app/cards/ptcg/en/sv3-125')
  })

  it('OPCG ZH_TW alias 卡組出自己的 zh-tw URL（不轉址到 canonical JA）', () => {
    const url = buildCardShareUrl({ game: 'OPCG', language: 'ZH_TW', externalId: 'OP01-001' }, ORIGIN)
    expect(url).toBe('https://pocketbindr.app/cards/opcg/zh-tw/OP01-001')
  })

  it('externalId 含特殊字元時正確 encode', () => {
    const url = buildCardShareUrl({ game: 'OPCG', language: 'JA', externalId: 'ST01_002' }, ORIGIN)
    expect(url).toContain('/cards/opcg/ja/')
    // encodeURIComponent 不會動 underscore，但斜線一類字元必須被 encode
    const slashed = buildCardShareUrl({ game: 'PTCG', language: 'JA', externalId: 'sv/1' }, ORIGIN)
    expect(slashed).toBe('https://pocketbindr.app/cards/ptcg/ja/sv%2F1')
  })
})

describe('shareOrCopy', () => {
  const URL_UNDER_TEST = `${ORIGIN}/cards/ptcg/en/sv3-125`

  it('navigator.share 存在時呼叫之，回傳 shared', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share, clipboard: { writeText } })

    await expect(shareOrCopy(URL_UNDER_TEST, 'Pikachu')).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({ title: 'Pikachu', url: URL_UNDER_TEST })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('使用者取消分享單（AbortError）回傳 dismissed，不 fallback 到剪貼簿', async () => {
    const abort = new Error('user aborted')
    abort.name = 'AbortError'
    const share = vi.fn().mockRejectedValue(abort)
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share, clipboard: { writeText } })

    await expect(shareOrCopy(URL_UNDER_TEST, 'Pikachu')).resolves.toBe('dismissed')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('navigator.share 不存在時 fallback 剪貼簿，回傳 copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await expect(shareOrCopy(URL_UNDER_TEST, 'Pikachu')).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST)
  })

  it('navigator.share 拋非 AbortError 時 fallback 剪貼簿，回傳 copied', async () => {
    const notAllowed = new Error('not allowed')
    notAllowed.name = 'NotAllowedError'
    const share = vi.fn().mockRejectedValue(notAllowed)
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share, clipboard: { writeText } })

    await expect(shareOrCopy(URL_UNDER_TEST, 'Pikachu')).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST)
  })
})
