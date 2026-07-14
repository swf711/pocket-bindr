import { describe, it, expect, vi, beforeEach } from 'vitest'

const readFileSyncMock = vi.hoisted(() => vi.fn())

vi.mock('fs', () => ({
  readFileSync: readFileSyncMock,
}))

describe('ogFonts', () => {
  beforeEach(() => {
    vi.resetModules()
    readFileSyncMock.mockReset()
  })

  it('回傳 400 / 700 兩個字重', async () => {
    readFileSyncMock.mockReturnValue(Buffer.from([1, 2, 3]))
    const { ogFonts } = await import('../og-fonts')

    const fonts = ogFonts()
    expect(fonts).toHaveLength(2)
    expect(fonts.map((f) => f.weight).sort()).toEqual([400, 700])
    expect(fonts.every((f) => f.name === 'Noto Sans JP' && f.style === 'normal')).toBe(true)
  })

  it('memoize：兩次呼叫不重複讀檔', async () => {
    readFileSyncMock.mockReturnValue(Buffer.from([1, 2, 3]))
    const { ogFonts } = await import('../og-fonts')

    ogFonts()
    ogFonts()
    expect(readFileSyncMock).toHaveBeenCalledTimes(2) // regular + bold，僅第一次呼叫觸發
  })

  it('讀檔失敗回空陣列，不 throw', async () => {
    readFileSyncMock.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    const { ogFonts } = await import('../og-fonts')

    expect(() => ogFonts()).not.toThrow()
    expect(ogFonts()).toEqual([])
  })
})
