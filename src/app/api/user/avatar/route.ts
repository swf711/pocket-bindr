import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureAvatarBucket, uploadAvatar, deleteAvatar } from '@/lib/avatar-storage'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg'])

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size === 0 || file.size > MAX_AVATAR_BYTES) {
      return Response.json({ error: 'AVATAR_INVALID' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    await ensureAvatarBucket()
    const imageUrl = await uploadAvatar(session.user.id, buffer, file.type)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    })

    return Response.json({ image: imageUrl })
  } catch (err) {
    console.error('[POST /api/user/avatar]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    })
    await deleteAvatar(session.user.id)

    return Response.json({ image: null })
  } catch (err) {
    console.error('[DELETE /api/user/avatar]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
