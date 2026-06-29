import { prisma } from '@/lib/prisma'
import {
  SUPPORTED_PROVIDERS,
  LINK_STATE_COOKIE,
  verifyLinkState,
  extractNonceFromCookie,
  nonceMatchesCookie,
  exchangeGoogleCode,
  exchangeDiscordCode,
  getCallbackUrl,
  clearLinkStateCookie,
} from '@/lib/link-oauth'
import type { SupportedOAuthProvider } from '@/types/user'
import type { Prisma } from '@prisma/client'

function redirectWithClearCookie(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Set-Cookie': clearLinkStateCookie(),
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const url = new URL(request.url)

  if (!SUPPORTED_PROVIDERS.includes(provider as SupportedOAuthProvider)) {
    return redirectWithClearCookie('/settings?link_error=INVALID_STATE')
  }

  const stateParam = url.searchParams.get('state')
  if (!stateParam) {
    return redirectWithClearCookie('/settings?link_error=INVALID_STATE')
  }

  let payload
  try {
    payload = verifyLinkState(stateParam)
  } catch {
    return redirectWithClearCookie('/settings?link_error=INVALID_STATE')
  }

  const cookieNonce = extractNonceFromCookie(request.headers.get('cookie'))
  if (!cookieNonce || !nonceMatchesCookie(payload.nonce, cookieNonce)) {
    return redirectWithClearCookie('/settings?link_error=INVALID_STATE')
  }

  const code = url.searchParams.get('code')
  if (!code) {
    return redirectWithClearCookie('/settings?link_error=INVALID_STATE')
  }

  const baseUrl = process.env.AUTH_URL ?? new URL(request.url).origin
  const redirectUri = getCallbackUrl(baseUrl, provider as SupportedOAuthProvider)

  let profile
  try {
    profile =
      provider === 'google'
        ? await exchangeGoogleCode(code, redirectUri)
        : await exchangeDiscordCode(code, redirectUri)
  } catch {
    return redirectWithClearCookie('/settings?link_error=OAUTH_FAILED')
  }

  const existingAccount = await prisma.account.findFirst({
    where: { provider, providerAccountId: profile.providerAccountId },
  })

  if (existingAccount) {
    if (existingAccount.userId === payload.userId) {
      return redirectWithClearCookie('/settings?link_error=ALREADY_LINKED')
    }
    return redirectWithClearCookie('/settings?link_error=PROVIDER_ACCOUNT_TAKEN')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    return redirectWithClearCookie('/settings?link_error=INVALID_STATE')
  }

  try {
    await prisma.account.create({
      data: {
        userId: payload.userId,
        type: 'oauth',
        provider,
        providerAccountId: profile.providerAccountId,
        access_token: profile.accessToken,
        refresh_token: profile.refreshToken ?? null,
        expires_at: profile.expiresAt ?? null,
        token_type: profile.tokenType ?? null,
        scope: profile.scope ?? null,
        id_token: profile.idToken ?? null,
      },
    })
  } catch (err) {
    const prismaErr = err as Prisma.PrismaClientKnownRequestError
    if (prismaErr.code === 'P2002') {
      return redirectWithClearCookie('/settings?link_error=PROVIDER_ACCOUNT_TAKEN')
    }
    throw err
  }

  return redirectWithClearCookie(`/settings?link_success=${provider}`)
}
