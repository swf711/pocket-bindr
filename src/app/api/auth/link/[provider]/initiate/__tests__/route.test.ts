import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAuth, mockFindFirst, mockCreateLinkState, mockBuildGoogle, mockBuildDiscord, mockGetCallbackUrl, mockMakeCookie } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreateLinkState: vi.fn().mockReturnValue({ state: 'mock-state', nonce: 'mock-nonce' }),
  mockBuildGoogle: vi.fn().mockReturnValue('https://accounts.google.com/mock-auth'),
  mockBuildDiscord: vi.fn().mockReturnValue('https://discord.com/mock-auth'),
  mockGetCallbackUrl: vi.fn().mockReturnValue('http://localhost:3000/api/auth/link/google/callback'),
  mockMakeCookie: vi.fn().mockReturnValue('link_state_nonce=mock-nonce; HttpOnly; SameSite=Lax; Max-Age=600; Path=/api/auth/link'),
}))

vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: { findFirst: mockFindFirst },
  },
}))

vi.mock('@/lib/link-oauth', () => ({
  SUPPORTED_PROVIDERS: ['google', 'discord'],
  createLinkState: mockCreateLinkState,
  buildGoogleAuthUrl: mockBuildGoogle,
  buildDiscordAuthUrl: mockBuildDiscord,
  getCallbackUrl: mockGetCallbackUrl,
  makeLinkStateCookie: mockMakeCookie,
}))

import { POST } from '../route'

function makeRequest(provider: string) {
  return new Request(`http://localhost:3000/api/auth/link/${provider}/initiate`, { method: 'POST' })
}

function makeParams(provider: string) {
  return { params: Promise.resolve({ provider }) }
}

describe('POST /api/auth/link/[provider]/initiate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入 → 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest('google'), makeParams('google'))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('provider = twitter → 400 INVALID_PROVIDER', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await POST(makeRequest('twitter'), makeParams('twitter'))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('INVALID_PROVIDER')
  })

  it('已連結 google → 409 ALREADY_LINKED', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindFirst.mockResolvedValue({ id: 'acc-1', provider: 'google' })
    const res = await POST(makeRequest('google'), makeParams('google'))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('ALREADY_LINKED')
  })

  it('正常 google → 200 { authUrl } + Set-Cookie 含 link_state_nonce', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindFirst.mockResolvedValue(null)
    const res = await POST(makeRequest('google'), makeParams('google'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.authUrl).toBe('https://accounts.google.com/mock-auth')
    expect(res.headers.get('set-cookie')).toContain('link_state_nonce')
  })

  it('正常 discord → 200 { authUrl } 指向 discord', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindFirst.mockResolvedValue(null)
    mockBuildDiscord.mockReturnValue('https://discord.com/mock-auth')
    const res = await POST(makeRequest('discord'), makeParams('discord'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.authUrl).toBe('https://discord.com/mock-auth')
  })
})
