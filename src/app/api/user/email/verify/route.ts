import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyEmailVerifyToken } from '@/lib/email-verify-token'
import { emailVerifyIpLimiter } from '@/lib/rate-limit'

// Confirms ownership of the email submitted via POST /api/user/email/request
// and writes it to User.email. Requires the logged-in user to match the
// token's userId (defense in depth: even a leaked token can't be redeemed by
// someone else). Re-checks uniqueness inside the transaction (TOCTOU: the
// email may have been claimed by another account between request and verify).
export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
    const ipResult = await emailVerifyIpLimiter.limit(ip)
    if (!ipResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body as { token: unknown }

    if (typeof token !== 'string' || !token) {
      return Response.json({ error: 'TOKEN_INVALID' }, { status: 400 })
    }

    let payload
    try {
      payload = verifyEmailVerifyToken(token)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      const error = msg === 'TOKEN_EXPIRED' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
      return Response.json({ error }, { status: 400 })
    }

    // The email to write is always the one bound (and signed) inside the
    // token — never trust a client-supplied email here.
    if (session.user.id !== payload.userId) {
      return Response.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      const self = await tx.user.findUniqueOrThrow({
        where: { id: payload.userId },
        select: { email: true },
      })
      if (self.email != null) {
        throw new Error('EMAIL_ALREADY_SET')
      }

      const existing = await tx.user.findUnique({
        where: { email: payload.email },
        select: { id: true },
      })
      if (existing) {
        throw new Error('EMAIL_ALREADY_USED')
      }

      await tx.user.update({
        where: { id: payload.userId },
        data: { email: payload.email, emailVerified: new Date() },
      })
    })

    return Response.json({ success: true })
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      return Response.json({ error: 'EMAIL_ALREADY_USED' }, { status: 409 })
    }
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'EMAIL_ALREADY_USED' || msg === 'EMAIL_ALREADY_SET') {
      return Response.json({ error: msg }, { status: 409 })
    }
    console.error('[POST /api/user/email/verify]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
