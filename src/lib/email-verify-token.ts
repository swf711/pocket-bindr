import { createHmac, timingSafeEqual } from 'crypto'

export type EmailVerifyPurpose = 'verify-email' | 'verify-signup'

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
    exp: Date.now() + 15 * 60 * 1000,
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
