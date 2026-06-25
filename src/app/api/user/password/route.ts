import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isPasswordValid } from '@/lib/password-policy'
import bcrypt from 'bcryptjs'

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body as {
      currentPassword: unknown
      newPassword: unknown
    }

    if (typeof newPassword !== 'string' || !isPasswordValid(newPassword)) {
      return Response.json({ error: 'INVALID_NEW_PASSWORD' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user?.passwordHash) {
      return Response.json({ error: 'NO_PASSWORD_SET' }, { status: 400 })
    }

    if (typeof currentPassword !== 'string') {
      return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return Response.json({ error: 'WRONG_PASSWORD' }, { status: 401 })
    }

    const newHash = await bcrypt.hash(newPassword, 12)
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
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { newPassword } = body as { newPassword: unknown }

    if (typeof newPassword !== 'string' || !isPasswordValid(newPassword)) {
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

    const newHash = await bcrypt.hash(newPassword, 12)
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
