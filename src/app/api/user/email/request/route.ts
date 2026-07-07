import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createEmailVerifyToken } from '@/lib/email-verify-token'
import { sendEmailVerification } from '@/lib/email'
import { emailRequestIpLimiter, emailRequestUserLimiter } from '@/lib/rate-limit'
import { addEmailSchema } from '@/lib/schemas/user'

// Lets a pure-OAuth user (User.email === null) request adding an email.
// Sends a verification link; the email is only written to User.email once
// POST /api/user/email/verify confirms ownership (see /verify-email route).
export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
    const ipResult = await emailRequestIpLimiter.limit(ip)
    if (!ipResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userResult = await emailRequestUserLimiter.limit(session.user.id)
    if (!userResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const body = await request.json()
    const { email } = body as { email: unknown }

    const parsed = addEmailSchema.shape.email.safeParse(email)
    if (!parsed.success) {
      return Response.json({ error: 'INVALID_EMAIL' }, { status: 400 })
    }

    const self = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, username: true },
    })

    // Only adding a first email is allowed here — an existing email must go
    // through a different (not-yet-built) change-email flow, not this endpoint.
    if (self?.email != null) {
      return Response.json({ error: 'EMAIL_ALREADY_SET' }, { status: 409 })
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data },
      select: { id: true },
    })
    if (existing) {
      return Response.json({ error: 'EMAIL_ALREADY_USED' }, { status: 409 })
    }

    const token = createEmailVerifyToken(session.user.id, parsed.data)
    await sendEmailVerification(parsed.data, token, self?.username ?? undefined)

    return Response.json({ success: true })
  } catch (err) {
    console.error('[POST /api/user/email/request]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
