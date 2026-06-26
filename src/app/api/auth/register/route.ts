import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth-utils'
import { registerIpLimiter, registerEmailLimiter } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const ipResult = await registerIpLimiter.limit(ip)
  if (!ipResult.success) {
    return NextResponse.json({ success: false, error: 'RATE_LIMITED' }, { status: 429 })
  }

  const body = await req.json()
  const { email, username, password } = body

  if (!email || !username || !password) {
    return NextResponse.json({ success: false, error: 'INVALID_INPUT' }, { status: 400 })
  }

  if (typeof email === 'string') {
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
