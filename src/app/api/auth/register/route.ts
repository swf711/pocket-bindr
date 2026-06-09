import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, username, password } = body

  if (!email || !username || !password) {
    return NextResponse.json({ success: false, error: 'INVALID_INPUT' }, { status: 400 })
  }

  const result = await registerUser({ email, username, password })

  if (!result.success) {
    return NextResponse.json(result, { status: 409 })
  }

  return NextResponse.json(result, { status: 201 })
}
