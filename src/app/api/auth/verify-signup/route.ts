import { prisma } from '@/lib/prisma'
import { verifyEmailVerifyToken } from '@/lib/email-verify-token'
import { signupVerifyIpLimiter } from '@/lib/rate-limit'
import { verifySignupSchema } from '@/lib/schemas/auth'

// 免登入（D4）：註冊者點驗證連結時通常尚未登入（換裝置/隔天才點）。
// single-use 靠 emailVerified 本身（D5）：已驗證則此路徑視為 no-op，回 409 ALREADY_VERIFIED。
export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
    const ipResult = await signupVerifyIpLimiter.limit(ip)
    if (!ipResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = verifySignupSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'TOKEN_INVALID' }, { status: 400 })
    }

    let payload
    try {
      payload = verifyEmailVerifyToken(parsed.data.token, 'verify-signup')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      const error = msg === 'TOKEN_EXPIRED' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
      return Response.json({ error }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, emailVerified: true },
    })
    if (!user || user.email !== payload.email) {
      return Response.json({ error: 'TOKEN_INVALID' }, { status: 400 })
    }
    if (user.emailVerified != null) {
      return Response.json({ error: 'ALREADY_VERIFIED' }, { status: 409 })
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { emailVerified: new Date() },
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('[POST /api/auth/verify-signup]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
