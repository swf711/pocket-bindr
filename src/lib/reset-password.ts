import { createHmac, timingSafeEqual } from 'crypto'

export interface ResetTokenPayload {
  userId: string
  email: string
  pwHashPrefix: string
  exp: number
}

export function createResetToken(
  userId: string,
  email: string,
  passwordHash: string,
): string {
  const payload: ResetTokenPayload = {
    userId,
    email,
    pwHashPrefix: passwordHash.slice(0, 8),
    exp: Date.now() + 15 * 60 * 1000,
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', process.env.RESET_TOKEN_SECRET!)
    .update(data)
    .digest('hex')
  return `${data}.${sig}`
}

export function verifyResetToken(token: string): ResetTokenPayload {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) throw new Error('TOKEN_INVALID')

  const data = token.slice(0, dotIndex)
  const sig = token.slice(dotIndex + 1)
  if (!data || !sig) throw new Error('TOKEN_INVALID')

  const expectedSig = createHmac('sha256', process.env.RESET_TOKEN_SECRET!)
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

  let payload: ResetTokenPayload
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as ResetTokenPayload
  } catch {
    throw new Error('TOKEN_INVALID')
  }

  if (!payload.userId || !payload.email || !payload.pwHashPrefix || !payload.exp) {
    throw new Error('TOKEN_INVALID')
  }
  if (payload.exp < Date.now()) throw new Error('TOKEN_EXPIRED')

  return payload
}
