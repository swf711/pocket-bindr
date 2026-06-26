import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  SUPPORTED_PROVIDERS,
  createLinkState,
  buildGoogleAuthUrl,
  buildDiscordAuthUrl,
  getCallbackUrl,
  makeLinkStateCookie,
} from '@/lib/link-oauth'
import { linkIpLimiter, linkUserLimiter } from '@/lib/rate-limit'
import type { SupportedOAuthProvider } from '@/types/user'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
  const ipResult = await linkIpLimiter.limit(ip)
  if (!ipResult.success) {
    return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userResult = await linkUserLimiter.limit(session.user.id)
  if (!userResult.success) {
    return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
  }

  const { provider } = await params
  if (!SUPPORTED_PROVIDERS.includes(provider as SupportedOAuthProvider)) {
    return Response.json({ error: 'INVALID_PROVIDER' }, { status: 400 })
  }

  const existing = await prisma.account.findFirst({
    where: { userId: session.user.id, provider },
  })
  if (existing) {
    return Response.json({ error: 'ALREADY_LINKED' }, { status: 409 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin
  const redirectUri = getCallbackUrl(baseUrl, provider as SupportedOAuthProvider)
  const { state, nonce } = createLinkState(session.user.id)

  const authUrl =
    provider === 'google'
      ? buildGoogleAuthUrl(redirectUri, state)
      : buildDiscordAuthUrl(redirectUri, state)

  const isProduction = process.env.NODE_ENV === 'production'
  const cookieHeader = makeLinkStateCookie(nonce, isProduction)

  return Response.json(
    { authUrl },
    {
      status: 200,
      headers: { 'Set-Cookie': cookieHeader },
    }
  )
}
