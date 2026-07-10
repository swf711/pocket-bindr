import { prisma } from '@/lib/prisma'
import { createEmailVerifyToken } from '@/lib/email-verify-token'
import { sendSignupVerificationEmail } from '@/lib/email'
import { resendVerificationIpLimiter, resendVerificationEmailLimiter } from '@/lib/rate-limit'
import { resendVerificationSchema } from '@/lib/schemas/auth'

const SUCCESS_MESSAGE = '若此 email 有帳號且尚未驗證，您將在幾分鐘內收到驗證信'

// D6 死鎖逃生口：一律回 200（防 enumeration），僅未驗證的 credentials 帳號才實際寄信。
export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
    const ipResult = await resendVerificationIpLimiter.limit(ip)
    if (!ipResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = resendVerificationSchema.safeParse(body)
    const email = parsed.success ? parsed.data.email ?? null : null
    if (!email) {
      return Response.json({ message: SUCCESS_MESSAGE })
    }

    const emailResult = await resendVerificationEmailLimiter.limit(email.toLowerCase())
    if (!emailResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, passwordHash: true, emailVerified: true },
    })

    if (user?.passwordHash && user.email && user.emailVerified == null) {
      const token = createEmailVerifyToken(user.id, user.email, 'verify-signup')
      await sendSignupVerificationEmail(user.email, token, user.username ?? undefined)
    }

    return Response.json({ message: SUCCESS_MESSAGE })
  } catch (err) {
    console.error('[POST /api/auth/resend-verification]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
