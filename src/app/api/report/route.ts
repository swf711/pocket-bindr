import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReportEmail } from '@/lib/email'
import { reportIpLimiter, reportUserLimiter } from '@/lib/rate-limit'
import { reportSchema } from '@/lib/schemas/report'

export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
    const ipResult = await reportIpLimiter.limit(ip)
    if (!ipResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userResult = await reportUserLimiter.limit(session.user.id)
    if (!userResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = reportSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? 'INVALID_INPUT' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, username: true },
    })

    try {
      await sendReportEmail({
        reporterEmail: user?.email ?? null,
        reporterId: session.user.id,
        username: user?.username ?? null,
        type: parsed.data.type,
        message: parsed.data.message,
        cardContext: parsed.data.cardContext,
      })
    } catch (err) {
      console.error('[POST /api/report] sendReportEmail failed', err)
      return Response.json({ error: 'SEND_FAILED' }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/report]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
