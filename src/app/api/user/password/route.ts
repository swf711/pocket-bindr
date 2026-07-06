import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
  passwordChangeIpLimiter,
  passwordChangeUserLimiter,
  passwordSetIpLimiter,
  passwordSetUserLimiter,
} from '@/lib/rate-limit'
import { changePasswordSchema, setPasswordSchema } from '@/lib/schemas/user'

export async function PATCH(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
    const ipResult = await passwordChangeIpLimiter.limit(ip)
    if (!ipResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userResult = await passwordChangeUserLimiter.limit(session.user.id)
    if (!userResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body as {
      currentPassword: unknown
      newPassword: unknown
    }

    // 依原本順序：newPassword 強度 → 確認已設定密碼 → currentPassword 型別，
    // 維持分開驗證以保留原本的檢查順序與各自的 error code。
    const newPasswordResult = changePasswordSchema.shape.newPassword.safeParse(newPassword)
    if (!newPasswordResult.success) {
      return Response.json({ error: 'INVALID_NEW_PASSWORD' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user?.passwordHash) {
      return Response.json({ error: 'NO_PASSWORD_SET' }, { status: 400 })
    }

    const currentPasswordResult = changePasswordSchema.shape.currentPassword.safeParse(currentPassword)
    if (!currentPasswordResult.success) {
      return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPasswordResult.data, user.passwordHash)
    if (!valid) {
      return Response.json({ error: 'WRONG_PASSWORD' }, { status: 401 })
    }

    const newHash = await bcrypt.hash(newPasswordResult.data, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/user/password]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Set a password for a pure-OAuth user (no existing passwordHash) as a login
// escape hatch. Distinct from PATCH (change existing password): no
// currentPassword required, only allowed when passwordHash is null.
export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
    const ipResult = await passwordSetIpLimiter.limit(ip)
    if (!ipResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userResult = await passwordSetUserLimiter.limit(session.user.id)
    if (!userResult.success) {
      return Response.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }

    const body = await request.json()
    const { newPassword } = body as { newPassword: unknown }

    const newPasswordResult = setPasswordSchema.shape.newPassword.safeParse(newPassword)
    if (!newPasswordResult.success) {
      return Response.json({ error: 'INVALID_NEW_PASSWORD' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true, email: true },
    })

    // verifyCredentials looks up users by email, so a password is only usable
    // as a login method when the user has an email identifier.
    if (!user?.email) {
      return Response.json({ error: 'EMAIL_REQUIRED' }, { status: 400 })
    }

    if (user.passwordHash) {
      return Response.json({ error: 'PASSWORD_ALREADY_SET' }, { status: 409 })
    }

    const newHash = await bcrypt.hash(newPasswordResult.data, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('[POST /api/user/password]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
