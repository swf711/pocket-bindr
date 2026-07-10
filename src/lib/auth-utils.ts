import bcrypt from 'bcryptjs'
import { CredentialsSignin } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { isPasswordValid } from '@/lib/password-policy'
import type { RegisterInput, RegisterResult, LoginInput } from '@/types/auth'

// code 會被 next-auth client 的 signIn(redirect:false) 以 URL query 帶回（result.code），
// 讓前端可分流顯示「請先驗證 email」+ 重寄入口，而非泛用的帳密錯誤訊息。
export class EmailNotVerifiedError extends CredentialsSignin {
  code = 'EMAIL_NOT_VERIFIED'
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const { email, username, password } = input

  if (!isPasswordValid(password)) return { success: false, error: 'WEAK_PASSWORD' }

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

  // Credentials 登入需 email 已驗證；OAuth 使用者不受影響（passwordHash 為 null 已在上方 return）。
  if (user.emailVerified == null) throw new EmailNotVerifiedError()

  return user
}
