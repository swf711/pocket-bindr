import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { RegisterInput, RegisterResult, LoginInput } from '@/types/auth'

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const { email, username, password } = input

  const existingEmail = await prisma.user.findUnique({ where: { email } })
  if (existingEmail) return { success: false, error: 'EMAIL_TAKEN' }

  const existingUsername = await prisma.user.findUnique({ where: { username } })
  if (existingUsername) return { success: false, error: 'USERNAME_TAKEN' }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  })

  return { success: true, userId: user.id }
}

export async function verifyCredentials(input: LoginInput) {
  const { email, password } = input

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash) return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  return user
}
