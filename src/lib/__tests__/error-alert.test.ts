import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSet = vi.fn()
vi.mock('@/lib/redis', () => ({
  redis: { set: (...args: unknown[]) => mockSet(...args) },
}))

import {
  reportServerError,
  buildAlertContent,
  throttleKey,
  isAlertingEnabled,
  type ServerErrorInput,
} from '../error-alert'

const input: ServerErrorInput = {
  name: 'PrismaClientKnownRequestError',
  message: 'Invalid `prisma.card.count()` invocation:\n\n  where: { email: "secret@example.com" }',
  digest: '12345',
  method: 'GET',
  routePath: '/[locale]/b/[token]',
  routeType: 'render',
}

describe('isAlertingEnabled', () => {
  it('僅 production 且有 webhook URL 才啟用', () => {
    expect(isAlertingEnabled({ VERCEL_ENV: 'production', ERROR_ALERT_WEBHOOK_URL: 'https://x' })).toBe(true)
    expect(isAlertingEnabled({ VERCEL_ENV: 'preview', ERROR_ALERT_WEBHOOK_URL: 'https://x' })).toBe(false)
    expect(isAlertingEnabled({ VERCEL_ENV: 'production' })).toBe(false)
    expect(isAlertingEnabled({})).toBe(false)
  })
})

describe('buildAlertContent', () => {
  it('只帶 route pattern、method、錯誤類別、訊息首行與 digest', () => {
    const content = buildAlertContent(input)
    expect(content).toContain('GET /[locale]/b/[token]')
    expect(content).toContain('PrismaClientKnownRequestError')
    expect(content).toContain('Invalid `prisma.card.count()` invocation:')
    expect(content).toContain('12345')
  })

  it('訊息第二行起（可能含資料值）一律不送', () => {
    expect(buildAlertContent(input)).not.toContain('secret@example.com')
  })

  it('訊息首行過長時截斷、整體不超過 Discord 上限', () => {
    const content = buildAlertContent({ ...input, message: 'x'.repeat(5000) })
    expect(content.length).toBeLessThanOrEqual(1800)
    expect(content).not.toContain('x'.repeat(201))
  })
})

describe('throttleKey', () => {
  it('同一路由同一錯誤 → 同一個 key；不同路由 → 不同 key', () => {
    expect(throttleKey(input)).toBe(throttleKey({ ...input, digest: 'other' } as ServerErrorInput))
    expect(throttleKey(input)).not.toBe(throttleKey({ ...input, routePath: '/api/cards' }))
  })

  it('以第一行為準：後續行不同仍視為同一個錯誤', () => {
    expect(throttleKey(input)).toBe(throttleKey({ ...input, message: 'Invalid `prisma.card.count()` invocation:\nother' }))
  })
})

describe('reportServerError', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('ERROR_ALERT_WEBHOOK_URL', 'https://discord.example/webhook')
    mockSet.mockResolvedValue('OK')
    fetchMock.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('production 且首次出現 → 節流 key 以 NX+TTL 寫入並送出 webhook', async () => {
    await reportServerError(input)
    expect(mockSet).toHaveBeenCalledWith(throttleKey(input), '1', { nx: true, ex: 600 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://discord.example/webhook')
    expect(JSON.parse(init.body).content).toContain('GET /[locale]/b/[token]')
  })

  it('非 production 不送、也不碰 Redis', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    await reportServerError(input)
    expect(mockSet).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('未設 webhook URL 不送', async () => {
    vi.stubEnv('ERROR_ALERT_WEBHOOK_URL', '')
    await reportServerError(input)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('節流 key 已存在（NX 回 null）→ 不送', async () => {
    mockSet.mockResolvedValue(null)
    await reportServerError(input)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('webhook 失敗不會拋出', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(reportServerError(input)).resolves.toBeUndefined()
    spy.mockRestore()
  })

  it('Redis 失敗不會拋出、也不送（寧可漏報不洗版）', async () => {
    mockSet.mockRejectedValue(new Error('redis down'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(reportServerError(input)).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
