import { prisma } from '@/lib/prisma'
import { createResetToken } from '@/lib/reset-password'
import { sendResetPasswordEmail } from '@/lib/email'
import { forgotPasswordIpLimiter, forgotPasswordEmailLimiter } from '@/lib/rate-limit'

const SUCCESS_MESSAGE = '若此 email 有帳號，您將在幾分鐘內收到重設信'

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    const ipResult = await forgotPasswordIpLimiter.limit(ip)
    if (!ipResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const body = await request.json() as { email?: unknown }
    const email = typeof body.email === 'string' ? body.email.trim() : null
    if (!email) {
      return Response.json({ message: SUCCESS_MESSAGE })
    }

    const emailResult = await forgotPasswordEmailLimiter.limit(email.toLowerCase())
    if (!emailResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, email: true, username: true },
    })

    if (user?.passwordHash && user.email) {
      const token = createResetToken(user.id, user.email, user.passwordHash)
      await sendResetPasswordEmail(user.email, token, user.username ?? undefined)
    }

    return Response.json({ message: SUCCESS_MESSAGE })
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
