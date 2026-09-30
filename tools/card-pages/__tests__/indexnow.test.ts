import { describe, it, expect, vi } from 'vitest'
import {
  INDEXNOW_BATCH_SIZE,
  INDEXNOW_ENDPOINT,
  parseIndexNowMode,
  isValidIndexNowKey,
  indexNowKeyObjectKey,
  buildIndexNowPayloads,
  submitIndexNow,
} from '../indexnow'

const ORIGIN = 'https://cards.example.com'
const KEY = 'abcdef0123456789'

describe('parseIndexNowMode', () => {
  it('預設 changed，接受 all / off，其餘 throw', () => {
    expect(parseIndexNowMode(['--apply'])).toBe('changed')
    expect(parseIndexNowMode(['--indexnow=all'])).toBe('all')
    expect(parseIndexNowMode(['--indexnow=off'])).toBe('off')
    expect(() => parseIndexNowMode(['--indexnow=everything'])).toThrow()
  })
})

describe('isValidIndexNowKey', () => {
  it('8–128 個英數字或 -', () => {
    expect(isValidIndexNowKey(KEY)).toBe(true)
    expect(isValidIndexNowKey('a-b-c-d-e')).toBe(true)
    expect(isValidIndexNowKey('short')).toBe(false)
    expect(isValidIndexNowKey('has space in it')).toBe(false)
    expect(isValidIndexNowKey('x'.repeat(129))).toBe(false)
  })
})

describe('buildIndexNowPayloads', () => {
  it('host 與 keyLocation 指向子網域根目錄的 key 檔', () => {
    const [payload] = buildIndexNowPayloads(ORIGIN, KEY, [`${ORIGIN}/ptcg/en/sv3-25`])
    expect(payload.host).toBe('cards.example.com')
    expect(payload.keyLocation).toBe(`${ORIGIN}/${indexNowKeyObjectKey(KEY)}`)
    expect(payload.urlList).toEqual([`${ORIGIN}/ptcg/en/sv3-25`])
  })

  it('依協定上限切批', () => {
    const urls = Array.from({ length: INDEXNOW_BATCH_SIZE + 1 }, (_, i) => `${ORIGIN}/c/${i}`)
    const payloads = buildIndexNowPayloads(ORIGIN, KEY, urls)
    expect(payloads.map(p => p.urlList.length)).toEqual([INDEXNOW_BATCH_SIZE, 1])
  })

  it('沒有網址時不產生任何 payload', () => {
    expect(buildIndexNowPayloads(ORIGIN, KEY, [])).toEqual([])
  })
})

describe('submitIndexNow', () => {
  const payloads = buildIndexNowPayloads(ORIGIN, KEY, [`${ORIGIN}/a`, `${ORIGIN}/b`])

  it('2xx 計為成功，POST JSON 到 IndexNow 端點', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 })
    const result = await submitIndexNow(payloads, fetchMock as unknown as typeof fetch)
    expect(result).toEqual({ submitted: 2, failed: 0 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(INDEXNOW_ENDPOINT)
    expect(JSON.parse(init.body).urlList).toEqual([`${ORIGIN}/a`, `${ORIGIN}/b`])
  })

  it('非 2xx 與網路錯誤都不 throw，只計為失敗', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const rejected = vi.fn().mockResolvedValue({ ok: false, status: 403 })
    await expect(submitIndexNow(payloads, rejected as unknown as typeof fetch)).resolves.toEqual({
      submitted: 0,
      failed: 2,
    })
    const broken = vi.fn().mockRejectedValue(new Error('network down'))
    await expect(submitIndexNow(payloads, broken as unknown as typeof fetch)).resolves.toEqual({
      submitted: 0,
      failed: 2,
    })
    warn.mockRestore()
  })
})
