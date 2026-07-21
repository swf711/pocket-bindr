import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth-utils'
import { registerIpLimiter, registerEmailLimiter } from '@/lib/rate-limit'
import { registerSchema } from '@/lib/schemas/auth'
import { isDisposableEmailDomain, hasValidMxRecord } from '@/lib/email-precheck'
import { createEmailVerifyToken } from '@/lib/email-verify-token'
import { sendSignupVerificationEmail } from '@/lib/email'

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

  // D7：便宜預檢，降噪 + 省寄信額度，不取代所有權驗證（見下方仍會寄驗證信）。
  if (isDisposableEmailDomain(email)) {
    return NextResponse.json({ success: false, error: 'DISPOSABLE_EMAIL' }, { status: 400 })
  }
  if (!(await hasValidMxRecord(email))) {
    return NextResponse.json({ success: false, error: 'INVALID_EMAIL_DOMAIN' }, { status: 400 })
  }

  try {
    const result = await registerUser({ email, username, password })
    if (!result.success) {
      const status = result.error === 'WEAK_PASSWORD' ? 400 : 409
      return NextResponse.json(result, { status })
    }

    // 強制 email 驗證（D1）：註冊仍成功建帳號，但需點驗證信連結才可登入（見 verifyCredentials）。
    //
    // 寄信失敗刻意不影響 HTTP status：帳號此刻已建立、email 已被佔用，若回 500 使用者會
    // 以為註冊失敗而重試，卻必得 EMAIL_TAKEN——是條死路。改為仍回 201 並帶
    // emailSendFailed（additive，不破壞既有契約），由前端引導使用者按「重寄驗證信」。
    let emailSendFailed = false
    try {
      const token = createEmailVerifyToken(result.userId!, email, 'verify-signup')
      await sendSignupVerificationEmail(email, token, username)
    } catch (err) {
      // 與下方 catch 的 '[register] error:' 分開，讓漏斗診斷能直接區分兩類失敗。
      console.error('[register] verification email send failed:', err)
      emailSendFailed = true
    }

    return NextResponse.json({ ...result, emailSendFailed }, { status: 201 })
  } catch (err) {
    console.error('[register] error:', err)
    return NextResponse.json({ success: false, error: 'SERVER_ERROR' }, { status: 500 })
  }
}
