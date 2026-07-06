import { prisma } from '@/lib/prisma'
import { verifyResetToken } from '@/lib/reset-password'
import bcrypt from 'bcryptjs'
import { resetPasswordSchema } from '@/lib/schemas/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: unknown; newPassword?: unknown }

    // 依原本順序逐欄位驗證：token 型別 → token 加解密驗證 → newPassword 強度，
    // 不可合併成單一 safeParse，否則會改變「token 過期優先於密碼弱」的回應順序。
    const tokenResult = resetPasswordSchema.shape.token.safeParse(body.token)
    if (!tokenResult.success) {
      return Response.json({ error: 'TOKEN_INVALID' }, { status: 400 })
    }
    const token = tokenResult.data

    let payload
    try {
      payload = verifyResetToken(token)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      const error = msg === 'TOKEN_EXPIRED' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
      return Response.json({ error }, { status: 400 })
    }

    const newPasswordResult = resetPasswordSchema.shape.newPassword.safeParse(body.newPassword)
    if (!newPasswordResult.success) {
      return Response.json({ error: 'INVALID_NEW_PASSWORD' }, { status: 400 })
    }
    const newPassword = newPasswordResult.data

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
