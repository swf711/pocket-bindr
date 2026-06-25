import { prisma } from '@/lib/prisma'
import { verifyResetToken } from '@/lib/reset-password'
import { isPasswordValid } from '@/lib/password-policy'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: unknown; newPassword?: unknown }
    const { token, newPassword } = body

    if (typeof token !== 'string' || !token) {
      return Response.json({ error: 'TOKEN_INVALID' }, { status: 400 })
    }

    let payload
    try {
      payload = verifyResetToken(token)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      const error = msg === 'TOKEN_EXPIRED' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
      return Response.json({ error }, { status: 400 })
    }

    if (typeof newPassword !== 'string' || !isPasswordValid(newPassword)) {
      return Response.json({ error: 'INVALID_NEW_PASSWORD' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { passwordHash: true },
    })

    if (!user?.passwordHash || user.passwordHash.slice(0, 8) !== payload.pwHashPrefix) {
      return Response.json({ error: 'TOKEN_INVALID' }, { status: 400 })
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash: newHash },
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('[POST /api/auth/reset-password]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
