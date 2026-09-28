import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../r2', async () => {
  const actual = await vi.importActual<typeof import('../r2')>('../r2')
  return { ...actual, putObject: vi.fn().mockResolvedValue(undefined) }
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('contentTypeFor', () => {
  it('robots.txt / sitemap.xml 走固定對照表', async () => {
    const { contentTypeFor } = await import('../upload')
    expect(contentTypeFor('robots.txt')).toBe('text/plain; charset=utf-8')
    expect(contentTypeFor('sitemap.xml')).toBe('application/xml')
  })

  it('其餘 .xml 為 application/xml、.svg 為 image/svg+xml、其餘為 text/html', async () => {
    const { contentTypeFor } = await import('../upload')
    expect(contentTypeFor('sitemaps/cards-0.xml')).toBe('application/xml')
    expect(contentTypeFor('_assets/logo-light-sm.svg')).toBe('image/svg+xml')
    expect(contentTypeFor('ptcg/en/sv3-25')).toBe('text/html; charset=utf-8')
  })
})

describe('uploadAll', () => {
  it('併發上傳所有 key，且每個 key 帶正確 content-type', async () => {
    const { uploadAll } = await import('../upload')
    const { putObject } = await import('../r2')

    const keys = ['ptcg/en/a', 'ptcg/en/b', 'robots.txt', '_assets/logo-light-sm.svg']
    const local = new Map(keys.map(k => [k, `content-${k}`]))

    await uploadAll({} as never, 'my-bucket', keys, local)

    expect(putObject).toHaveBeenCalledTimes(4)
    expect(putObject).toHaveBeenCalledWith({}, 'my-bucket', 'ptcg/en/a', 'content-ptcg/en/a', 'text/html; charset=utf-8')
    expect(putObject).toHaveBeenCalledWith({}, 'my-bucket', 'robots.txt', 'content-robots.txt', 'text/plain; charset=utf-8')
    expect(putObject).toHaveBeenCalledWith(
      {},
      'my-bucket',
      '_assets/logo-light-sm.svg',
      'content-_assets/logo-light-sm.svg',
      'image/svg+xml',
    )
  })

  it('批次大於單批併發上限時仍會處理完所有 key（不遺漏）', async () => {
    const { uploadAll } = await import('../upload')
    const { putObject } = await import('../r2')

    // 刻意超過內部併發批次大小（50），驗證分批邏輯不會漏掉尾端的 key。
    const keys = Array.from({ length: 120 }, (_, i) => `ptcg/en/card-${i}`)
    const local = new Map(keys.map(k => [k, `content-${k}`]))

    await uploadAll({} as never, 'my-bucket', keys, local)

    expect(putObject).toHaveBeenCalledTimes(120)
    expect(putObject).toHaveBeenCalledWith({}, 'my-bucket', 'ptcg/en/card-119', 'content-ptcg/en/card-119', 'text/html; charset=utf-8')
  })
})
