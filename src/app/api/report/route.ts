import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendReportEmail, type ReportEmailAttachment } from '@/lib/email'
import { reportIpLimiter, reportUserLimiter } from '@/lib/rate-limit'
import {
  reportSchema,
  MAX_REPORT_ATTACHMENTS,
  MAX_REPORT_ATTACHMENT_BYTES,
  MAX_REPORT_ATTACHMENT_TOTAL_BYTES,
  ALLOWED_REPORT_ATTACHMENT_TYPES,
} from '@/lib/schemas/report'

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

    const formData = await request.formData()
    const payloadRaw = formData.get('payload')
    if (typeof payloadRaw !== 'string') {
      return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }

    let body: unknown
    try {
      body = JSON.parse(payloadRaw)
    } catch {
      return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }

    const parsed = reportSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? 'INVALID_INPUT' }, { status: 400 })
    }

    const files = formData.getAll('attachments').filter((f): f is File => f instanceof File)
    if (files.length > MAX_REPORT_ATTACHMENTS) {
      return Response.json({ error: 'ATTACHMENT_INVALID' }, { status: 400 })
    }
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    if (totalSize > MAX_REPORT_ATTACHMENT_TOTAL_BYTES) {
      return Response.json({ error: 'ATTACHMENT_INVALID' }, { status: 400 })
    }
    for (const file of files) {
      if (!ALLOWED_REPORT_ATTACHMENT_TYPES.has(file.type) || file.size === 0 || file.size > MAX_REPORT_ATTACHMENT_BYTES) {
        return Response.json({ error: 'ATTACHMENT_INVALID' }, { status: 400 })
      }
    }

    const attachments: ReportEmailAttachment[] = await Promise.all(
      files.map(async (file, i) => ({
        filename: `attachment-${i + 1}.${file.type.split('/')[1] ?? 'webp'}`,
        content: Buffer.from(await file.arrayBuffer()).toString('base64'),
        contentType: file.type,
      })),
    )

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
        attachments: attachments.length ? attachments : undefined,
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
