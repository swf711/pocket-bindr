import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth-utils'
import { registerIpLimiter, registerEmailLimiter } from '@/lib/rate-limit'
import { registerSchema } from '@/lib/schemas/auth'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const ipResult = await registerIpLimiter.limit(ip)
  if (!ipResult.success) {
    return NextResponse.json({ success: false, error: 'RATE_LIMITED' }, { status: 429 })
  }

  const body = await req.json()

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    // 原本行為：email/username/password 任一缺漏（falsy）一律回 INVALID_INPUT；
    // 密碼「有給但太弱」則交由 registerUser 內部判斷回 WEAK_PASSWORD——
    // 這裡沒有呼叫 registerUser，需自行判斷是否為「有給但太弱」的密碼情境並映射回同一字串，
    // 避免 zod 的 PASSWORD_TOO_SHORT 外洩。
    const bodyRecord = body as Record<string, unknown>
    const passwordProvided = typeof bodyRecord?.password === 'string' && bodyRecord.password.length > 0
    const passwordIssue = parsed.error.issues.some((i) => i.path[0] === 'password')
    if (passwordProvided && passwordIssue) {
      return NextResponse.json({ success: false, error: 'WEAK_PASSWORD' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'INVALID_INPUT' }, { status: 400 })
  }
  const { email, username, password } = parsed.data

  {
    const emailResult = await registerEmailLimiter.limit(email.toLowerCase())
    if (!emailResult.success) {
      return NextResponse.json({ success: false, error: 'RATE_LIMITED' }, { status: 429 })
    }
  }

  try {
    const result = await registerUser({ email, username, password })
    if (!result.success) {
      const status = result.error === 'WEAK_PASSWORD' ? 400 : 409
      return NextResponse.json(result, { status })
    }
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('[register] error:', err)
    return NextResponse.json({ success: false, error: 'SERVER_ERROR' }, { status: 500 })
  }
}
