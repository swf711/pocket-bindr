import { createHmac, timingSafeEqual, randomUUID } from 'crypto'
import type { SupportedOAuthProvider } from '@/types/user'

export interface LinkStatePayload {
  userId: string
  nonce: string
  exp: number
}

export interface OAuthProfile {
  providerAccountId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  tokenType?: string
  scope?: string
  idToken?: string
}

export const SUPPORTED_PROVIDERS: SupportedOAuthProvider[] = ['google', 'discord']
export const LINK_STATE_COOKIE = 'link_state_nonce'

// ─── State token ──────────────────────────────────────────────────────────────

export function createLinkState(userId: string): { state: string; nonce: string } {
  const nonce = randomUUID()
  const payload: LinkStatePayload = { userId, nonce, exp: Date.now() + 10 * 60 * 1000 }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', process.env.LINK_STATE_SECRET!)
    .update(data)
    .digest('hex')
  return { state: `${data}.${sig}`, nonce }
}

export function verifyLinkState(state: string): LinkStatePayload {
  const dotIndex = state.lastIndexOf('.')
  if (dotIndex === -1) throw new Error('INVALID_STATE')

  const data = state.slice(0, dotIndex)
  const sig = state.slice(dotIndex + 1)
  if (!data || !sig) throw new Error('INVALID_STATE')

  const expectedSig = createHmac('sha256', process.env.LINK_STATE_SECRET!)
    .update(data)
    .digest('hex')

  const sigBuf = Buffer.from(sig, 'hex')
  const expectedBuf = Buffer.from(expectedSig, 'hex')
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    throw new Error('INVALID_STATE')
  }

  let payload: LinkStatePayload
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as LinkStatePayload
  } catch {
    throw new Error('INVALID_STATE')
  }

  if (!payload.userId || !payload.nonce || !payload.exp) throw new Error('INVALID_STATE')
  if (payload.exp < Date.now()) throw new Error('EXPIRED_STATE')

  return payload
}

// ─── CSRF cookie helpers ───────────────────────────────────────────────────────

export function makeLinkStateCookie(nonce: string, secure: boolean): string {
  const base = `${LINK_STATE_COOKIE}=${nonce}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/api/auth/link`
  return secure ? `${base}; Secure` : base
}

export function clearLinkStateCookie(): string {
  return `${LINK_STATE_COOKIE}=; Max-Age=0; Path=/api/auth/link; HttpOnly; SameSite=Lax`
}

export function extractNonceFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key.trim() === LINK_STATE_COOKIE) return rest.join('=').trim() || null
  }
  return null
}

export function nonceMatchesCookie(stateNonce: string, cookieNonce: string): boolean {
  try {
    const a = Buffer.from(stateNonce)
    const b = Buffer.from(cookieNonce)
    if (a.length !== b.length) {
      // Constant-time with padding to avoid length timing leak
      const max = Math.max(a.length, b.length)
      const pa = Buffer.concat([a, Buffer.alloc(max - a.length)])
      const pb = Buffer.concat([b, Buffer.alloc(max - b.length)])
      timingSafeEqual(pa, pb) // always runs, result is discarded
      return false
    }
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// ─── OAuth URL builders ────────────────────────────────────────────────────────

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function buildDiscordAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    state,
  })
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}

// ─── Code exchange ─────────────────────────────────────────────────────────────

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<OAuthProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) throw new Error('OAUTH_FAILED')

  const token = await tokenRes.json() as {
    access_token: string
    id_token?: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    scope?: string
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  })
  if (!userRes.ok) throw new Error('OAUTH_FAILED')

  const user = await userRes.json() as { sub: string }

  return {
    providerAccountId: user.sub,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: token.expires_in ? Math.floor(Date.now() / 1000) + token.expires_in : undefined,
    tokenType: token.token_type,
    scope: token.scope,
    idToken: token.id_token,
  }
}

export async function exchangeDiscordCode(
  code: string,
  redirectUri: string
): Promise<OAuthProfile> {
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) throw new Error('OAUTH_FAILED')

  const token = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    scope?: string
  }

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  })
  if (!userRes.ok) throw new Error('OAUTH_FAILED')

  const user = await userRes.json() as { id: string }

  return {
    providerAccountId: user.id,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: token.expires_in ? Math.floor(Date.now() / 1000) + token.expires_in : undefined,
    tokenType: token.token_type,
    scope: token.scope,
  }
}

// ─── Helper ────────────────────────────────────────────────────────────────────

export function getCallbackUrl(baseUrl: string, provider: SupportedOAuthProvider): string {
  return `${baseUrl}/api/auth/link/${provider}/callback`
}
