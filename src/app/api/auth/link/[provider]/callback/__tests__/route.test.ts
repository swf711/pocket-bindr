import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockVerifyLinkState,
  mockExtractNonce,
  mockNonceMatch,
  mockExchangeGoogle,
  mockExchangeDiscord,
  mockGetCallbackUrl,
  mockClearCookie,
  mockAccountFindFirst,
  mockAccountCreate,
  mockUserFindUnique,
} = vi.hoisted(() => ({
  mockVerifyLinkState: vi.fn(),
  mockExtractNonce: vi.fn(),
  mockNonceMatch: vi.fn(),
  mockExchangeGoogle: vi.fn(),
  mockExchangeDiscord: vi.fn(),
  mockGetCallbackUrl: vi.fn().mockReturnValue('http://localhost:3000/api/auth/link/google/callback'),
  mockClearCookie: vi.fn().mockReturnValue('link_state_nonce=; Max-Age=0; Path=/api/auth/link; HttpOnly; SameSite=Lax'),
  mockAccountFindFirst: vi.fn(),
  mockAccountCreate: vi.fn(),
  mockUserFindUnique: vi.fn(),
}))

vi.mock('@/lib/link-oauth', () => ({
  SUPPORTED_PROVIDERS: ['google', 'discord'],
  LINK_STATE_COOKIE: 'link_state_nonce',
  verifyLinkState: mockVerifyLinkState,
  extractNonceFromCookie: mockExtractNonce,
  nonceMatchesCookie: mockNonceMatch,
  exchangeGoogleCode: mockExchangeGoogle,
  exchangeDiscordCode: mockExchangeDiscord,
  getCallbackUrl: mockGetCallbackUrl,
  clearLinkStateCookie: mockClearCookie,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: { findFirst: mockAccountFindFirst, create: mockAccountCreate },
    user: { findUnique: mockUserFindUnique },
  },
}))

import { GET } from '../route'

const VALID_PAYLOAD = { userId: 'user-1', nonce: 'nonce-abc', exp: Date.now() + 99999 }
const VALID_PROFILE = {
  providerAccountId: 'google-sub-123',
  accessToken: 'at',
  refreshToken: 'rt',
  expiresAt: 9999999999,
  tokenType: 'Bearer',
  scope: 'openid email profile',
  idToken: 'idt',
}

function makeRequest(provider: string, qs: Record<string, string>, cookie = 'link_state_nonce=nonce-abc') {
  const url = new URL(`http://localhost:3000/api/auth/link/${provider}/callback`)
  Object.entries(qs).forEach(([k, v]) => url.searchParams.set(k, v))
  return new Request(url.toString(), { headers: { Cookie: cookie } })
}

function makeParams(provider: string) {
  return { params: Promise.resolve({ provider }) }
}

describe('GET /api/auth/link/[provider]/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyLinkState.mockReturnValue(VALID_PAYLOAD)
    mockExtractNonce.mockReturnValue('nonce-abc')
    mockNonceMatch.mockReturnValue(true)
    mockExchangeGoogle.mockResolvedValue(VALID_PROFILE)
    mockExchangeDiscord.mockResolvedValue({ ...VALID_PROFILE, idToken: undefined })
    mockAccountFindFirst.mockResolvedValue(null)
    mockUserFindUnique.mockResolvedValue({ id: 'user-1' })
    mockAccountCreate.mockResolvedValue({})
    mockClearCookie.mockReturnValue('link_state_nonce=; Max-Age=0; Path=/api/auth/link; HttpOnly; SameSite=Lax')
  })

  it('state 缺失 → redirect INVALID_STATE + clear cookie', async () => {
    const res = await GET(makeRequest('google', { code: 'c' }), makeParams('google'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_error=INVALID_STATE')
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0')
  })

  it('provider 不合法 → redirect INVALID_STATE', async () => {
    const res = await GET(makeRequest('twitter', { code: 'c', state: 's' }), makeParams('twitter'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_error=INVALID_STATE')
  })

  it('verifyLinkState throw → redirect INVALID_STATE', async () => {
    mockVerifyLinkState.mockImplementation(() => { throw new Error('INVALID_STATE') })
    const res = await GET(makeRequest('google', { code: 'c', state: 'bad' }), makeParams('google'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_error=INVALID_STATE')
  })

  it('cookie nonce 與 state nonce 不符 → redirect INVALID_STATE', async () => {
    mockNonceMatch.mockReturnValue(false)
    const res = await GET(makeRequest('google', { code: 'c', state: 'gs' }), makeParams('google'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_error=INVALID_STATE')
  })

  it('code 缺失 → redirect INVALID_STATE', async () => {
    const res = await GET(makeRequest('google', { state: 'gs' }), makeParams('google'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_error=INVALID_STATE')
  })

  it('exchangeGoogleCode throw → redirect OAUTH_FAILED', async () => {
    mockExchangeGoogle.mockRejectedValue(new Error('OAUTH_FAILED'))
    const res = await GET(makeRequest('google', { code: 'c', state: 'gs' }), makeParams('google'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_error=OAUTH_FAILED')
  })

  it('providerAccountId 已屬當前 user → redirect ALREADY_LINKED', async () => {
    mockAccountFindFirst.mockResolvedValue({ userId: 'user-1', provider: 'google', providerAccountId: 'google-sub-123' })
    const res = await GET(makeRequest('google', { code: 'c', state: 'gs' }), makeParams('google'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_error=ALREADY_LINKED')
  })

  it('providerAccountId 已屬他人 → redirect PROVIDER_ACCOUNT_TAKEN', async () => {
    mockAccountFindFirst.mockResolvedValue({ userId: 'other-user', provider: 'google', providerAccountId: 'google-sub-123' })
    const res = await GET(makeRequest('google', { code: 'c', state: 'gs' }), makeParams('google'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_error=PROVIDER_ACCOUNT_TAKEN')
  })

  it('state userId 帳號不存在 → redirect INVALID_STATE', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    const res = await GET(makeRequest('google', { code: 'c', state: 'gs' }), makeParams('google'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_error=INVALID_STATE')
  })

  it('account.create 拋 Prisma P2002 → redirect PROVIDER_ACCOUNT_TAKEN（並發競態）', async () => {
    const p2002 = Object.assign(new Error('unique violation'), { code: 'P2002' })
    mockAccountCreate.mockRejectedValue(p2002)
    const res = await GET(makeRequest('google', { code: 'c', state: 'gs' }), makeParams('google'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_error=PROVIDER_ACCOUNT_TAKEN')
  })

  it('成功 google → prisma.account.create 被呼叫 + redirect link_success=google', async () => {
    const res = await GET(makeRequest('google', { code: 'c', state: 'gs' }), makeParams('google'))
    expect(mockAccountCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ provider: 'google', userId: 'user-1' }) })
    )
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_success=google')
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0')
  })

  it('成功 discord → redirect link_success=discord', async () => {
    const res = await GET(makeRequest('discord', { code: 'c', state: 'ds' }), makeParams('discord'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/settings?link_success=discord')
  })
})
