import { z } from 'zod'
import { passwordSchema } from '@/lib/schemas/common'
import { usernameSchema } from '@/lib/schemas/user'

export const registerSchema = z.object({
  email: z.string().min(1, 'INVALID_INPUT').email('INVALID_INPUT'),
  username: usernameSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: z.string().min(1, 'INVALID_INPUT').email('INVALID_INPUT'),
  password: z.string().min(1, 'INVALID_INPUT'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'INVALID_INPUT').email('INVALID_INPUT'),
})

/**
 * POST /api/auth/forgot-password 專用的寬鬆版本。
 * 該 route 刻意不驗證 email 格式（防 enumeration：任何輸入都回同一句成功訊息，
 * 不回錯誤），原本只用 `typeof body.email === 'string'` 判斷型別、trim 後若為空字串
 * 視為「沒給 email」。這裡只做型別窄化，不套用 forgotPasswordSchema 的 email() 格式驗證，
 * 否則會讓不合法 email 格式提早被拒絕，破壞原本「一律回 200 同句訊息」的行為。
 */
export const forgotPasswordLenientSchema = z.object({
  email: z.string().trim().min(1).optional(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'TOKEN_INVALID'),
  newPassword: passwordSchema,
})

export const verifySignupSchema = z.object({
  token: z.string().min(1, 'TOKEN_INVALID'),
})

/**
 * POST /api/auth/resend-verification 專用：與 forgotPasswordLenientSchema 同理，
 * 防 enumeration 需一律回 200，故不套用 email() 格式驗證，只做型別窄化。
 */
export const resendVerificationSchema = z.object({
  email: z.string().trim().min(1).optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type VerifySignupInput = z.infer<typeof verifySignupSchema>
