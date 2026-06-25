import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'crypto'

vi.stubEnv('LINK_STATE_SECRET', 'test-secret-32-chars-long-enough!')
vi.stubEnv('GOOGLE_CLIENT_ID', 'google-client-id')
vi.stubEnv('GOOGLE_CLIENT_SECRET', 'google-client-secret')
vi.stubEnv('DISCORD_CLIENT_ID', 'discord-client-id')
vi.stubEnv('DISCORD_CLIENT_SECRET', 'discord-client-secret')

import {
  createLinkState,
  verifyLinkState,
  makeLinkStateCookie,
  clearLinkStateCookie,
  extractNonceFromCookie,
  nonceMatchesCookie,
  buildGoogleAuthUrl,
  buildDiscordAuthUrl,
  exchangeGoogleCode,
  exchangeDiscordCode,
  LINK_STATE_COOKIE,
} from '../link-oauth'

describe('createLinkState / verifyLinkState', () => {
  it('正常建立並驗簽，回傳正確 userId + exp > now', () => {
    const before = Date.now()
    const { state } = createLinkState('user-123')
    const payload = verifyLinkState(state)
    expect(payload.userId).toBe('user-123')
    expect(payload.exp).toBeGreaterThan(before)
    expect(payload.nonce).toBeTruthy()
  })

  it('createLinkState 回傳 nonce 與 state payload 的 nonce 一致', () => {
    const { state, nonce } = createLinkState('user-abc')
    const payload = verifyLinkState(state)
    expect(payload.nonce).toBe(nonce)
  })

  it('竄改 sig → throw INVALID_STATE', () => {
    const { state } = createLinkState('user-123')
    const [data] = state.split('.')
    const tampered = `${data}.badbadbadhex`
    expect(() => verifyLinkState(tampered)).toThrow('INVALID_STATE')
  })

  it('竄改 data payload（base64url 替換）→ throw INVALID_STATE', () => {
    const { state } = createLinkState('user-123')
    const parts = state.split('.')
    const fakePayload = Buffer.from(JSON.stringify({ userId: 'attacker', nonce: 'x', exp: Date.now() + 99999 })).toString('base64url')
    const tampered = `${fakePayload}.${parts[1]}`
    expect(() => verifyLinkState(tampered)).toThrow('INVALID_STATE')
  })

  it('格式錯誤（無 . 分隔）→ throw INVALID_STATE', () => {
    expect(() => verifyLinkState('nodotsinhere')).toThrow('INVALID_STATE')
  })

  it('空字串 → throw INVALID_STATE', () => {
    expect(() => verifyLinkState('')).toThrow('INVALID_STATE')
  })

  it('已過期（exp = now - 1）→ throw', () => {
    const { state } = createLinkState('user-123')
    const payload = verifyLinkState(state)
    // Manually rebuild an expired state
    const expiredPayload = { ...payload, exp: Date.now() - 1 }
    const data = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url')
    const sig = createHmac('sha256', 'test-secret-32-chars-long-enough!').update(data).digest('hex')
    const expiredState = `${data}.${sig}`
    expect(() => verifyLinkState(expiredState)).toThrow()
  })
})

describe('CSRF cookie helpers', () => {
  it('makeLinkStateCookie 包含 HttpOnly; SameSite=Lax; Max-Age=600', () => {
    const cookie = makeLinkStateCookie('testnonce', false)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Max-Age=600')
    expect(cookie).toContain(`${LINK_STATE_COOKIE}=testnonce`)
  })

  it('makeLinkStateCookie secure=true 包含 Secure', () => {
    const cookie = makeLinkStateCookie('testnonce', true)
    expect(cookie).toContain('Secure')
  })

  it('makeLinkStateCookie secure=false 不包含 Secure', () => {
    const cookie = makeLinkStateCookie('testnonce', false)
    expect(cookie).not.toContain('Secure')
  })

  it('clearLinkStateCookie 包含 Max-Age=0', () => {
    const cookie = clearLinkStateCookie()
    expect(cookie).toContain('Max-Age=0')
    expect(cookie).toContain(LINK_STATE_COOKIE)
  })

  it('extractNonceFromCookie 正確解析 Cookie header', () => {
    const result = extractNonceFromCookie('other=val; link_state_nonce=mynonce; another=x')
    expect(result).toBe('mynonce')
  })

  it('extractNonceFromCookie 找不到 key → null', () => {
    expect(extractNonceFromCookie('other=val')).toBeNull()
    expect(extractNonceFromCookie(null)).toBeNull()
    expect(extractNonceFromCookie('')).toBeNull()
  })

  it('nonceMatchesCookie 相同值 → true', () => {
    expect(nonceMatchesCookie('abc123', 'abc123')).toBe(true)
  })

  it('nonceMatchesCookie 不同值 → false', () => {
    expect(nonceMatchesCookie('abc123', 'xyz789')).toBe(false)
  })

  it('nonceMatchesCookie 長度不同 → false', () => {
    expect(nonceMatchesCookie('short', 'muchlongerstring')).toBe(false)
  })
})

describe('buildGoogleAuthUrl', () => {
  it('包含正確 hostname', () => {
    const url = buildGoogleAuthUrl('http://localhost:3000/cb', 'mystate')
    expect(url).toContain('accounts.google.com')
  })

  it('包含 scope openid email profile', () => {
    const url = buildGoogleAuthUrl('http://localhost:3000/cb', 'mystate')
    // URLSearchParams encodes spaces as +
    expect(url).toContain('scope=openid+email+profile')
  })

  it('不含 access_type=offline', () => {
    const url = buildGoogleAuthUrl('http://localhost:3000/cb', 'mystate')
    expect(url).not.toContain('access_type')
  })

  it('不含 prompt=consent', () => {
    const url = buildGoogleAuthUrl('http://localhost:3000/cb', 'mystate')
    expect(url).not.toContain('prompt')
  })

  it('包含 state 與 redirect_uri 參數', () => {
    const url = buildGoogleAuthUrl('http://localhost:3000/cb', 'mystate')
    expect(decodeURIComponent(url)).toContain('state=mystate')
    expect(decodeURIComponent(url)).toContain('redirect_uri=http://localhost:3000/cb')
  })
})

describe('buildDiscordAuthUrl', () => {
  it('包含正確 hostname', () => {
    const url = buildDiscordAuthUrl('http://localhost:3000/cb', 'mystate')
    expect(url).toContain('discord.com')
  })

  it('包含 scope identify email', () => {
    const url = buildDiscordAuthUrl('http://localhost:3000/cb', 'mystate')
    expect(url).toContain('scope=identify+email')
  })

  it('包含 state 與 redirect_uri 參數', () => {
    const url = buildDiscordAuthUrl('http://localhost:3000/cb', 'mystate')
    expect(decodeURIComponent(url)).toContain('state=mystate')
  })
})

describe('exchangeGoogleCode', () => {
  beforeEach(() => { vi.spyOn(global, 'fetch') })
  afterEach(() => { vi.restoreAllMocks() })

  it('成功：providerAccountId = sub', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        access_token: 'at', id_token: 'idt', refresh_token: 'rt', expires_in: 3600, token_type: 'Bearer', scope: 'openid email profile'
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ sub: 'google-sub-123' }), { status: 200 }))

    const profile = await exchangeGoogleCode('code', 'http://localhost/cb')
    expect(profile.providerAccountId).toBe('google-sub-123')
    expect(profile.accessToken).toBe('at')
    expect(profile.idToken).toBe('idt')
    expect(profile.refreshToken).toBe('rt')
  })

  it('token endpoint 非 2xx → throw OAUTH_FAILED', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 400 }))
    await expect(exchangeGoogleCode('bad-code', 'http://localhost/cb')).rejects.toThrow('OAUTH_FAILED')
  })

  it('userinfo endpoint 非 2xx → throw OAUTH_FAILED', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'at', expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
    await expect(exchangeGoogleCode('code', 'http://localhost/cb')).rejects.toThrow('OAUTH_FAILED')
  })
})

describe('exchangeDiscordCode', () => {
  beforeEach(() => { vi.spyOn(global, 'fetch') })
  afterEach(() => { vi.restoreAllMocks() })

  it('成功：providerAccountId = id', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        access_token: 'dat', refresh_token: 'drt', expires_in: 604800, token_type: 'Bearer', scope: 'identify email'
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'discord-id-456' }), { status: 200 }))

    const profile = await exchangeDiscordCode('code', 'http://localhost/cb')
    expect(profile.providerAccountId).toBe('discord-id-456')
    expect(profile.accessToken).toBe('dat')
    expect(profile.idToken).toBeUndefined()
  })

  it('token endpoint 非 2xx → throw OAUTH_FAILED', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 400 }))
    await expect(exchangeDiscordCode('bad', 'http://localhost/cb')).rejects.toThrow('OAUTH_FAILED')
  })

  it('users/@me 非 2xx → throw OAUTH_FAILED', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'dat', expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
    await expect(exchangeDiscordCode('code', 'http://localhost/cb')).rejects.toThrow('OAUTH_FAILED')
  })
})
