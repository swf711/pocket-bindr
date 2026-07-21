import { createHmac, timingSafeEqual } from 'crypto'

export type EmailVerifyPurpose = 'verify-email' | 'verify-signup'

// TTL 依用途分流：
// - verify-signup：註冊驗證信。使用者常在手機註冊、稍後才開信箱，15 分鐘過短會製造
//   「連結已死」的死路，故放寬為 24 小時（token 只能蓋 emailVerified，風險有限）。
// - verify-email：純 OAuth 使用者於設定頁補填 email，使用者當下就在等，維持 15 分鐘。
const TOKEN_TTL_MS: Record<EmailVerifyPurpose, number> = {
  'verify-signup': 24 * 60 * 60 * 1000,
  'verify-email': 15 * 60 * 1000,
}

export interface EmailVerifyTokenPayload {
  userId: string
  email: string
  purpose: EmailVerifyPurpose
  exp: number
}

export function createEmailVerifyToken(
  userId: string,
  email: string,
  purpose: EmailVerifyPurpose = 'verify-email',
): string {
  const payload: EmailVerifyTokenPayload = {
    userId,
    email,
    purpose,
    exp: Date.now() + TOKEN_TTL_MS[purpose],
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', process.env.EMAIL_VERIFY_SECRET!)
    .update(data)
    .digest('hex')
  return `${data}.${sig}`
}

export function verifyEmailVerifyToken(
  token: string,
  expectedPurpose: EmailVerifyPurpose = 'verify-email',
): EmailVerifyTokenPayload {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) throw new Error('TOKEN_INVALID')

  const data = token.slice(0, dotIndex)
  const sig = token.slice(dotIndex + 1)
  if (!data || !sig) throw new Error('TOKEN_INVALID')

  const expectedSig = createHmac('sha256', process.env.EMAIL_VERIFY_SECRET!)
    .update(data)
    .digest('hex')

  const sigBuf = Buffer.from(sig, 'hex')
  const expectedBuf = Buffer.from(expectedSig, 'hex')
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    throw new Error('TOKEN_INVALID')
  }

  let payload: EmailVerifyTokenPayload
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as EmailVerifyTokenPayload
  } catch {
    throw new Error('TOKEN_INVALID')
  }

  if (!payload.userId || !payload.email || payload.purpose !== expectedPurpose || !payload.exp) {
    throw new Error('TOKEN_INVALID')
  }
  if (payload.exp < Date.now()) throw new Error('TOKEN_EXPIRED')

  return payload
}
