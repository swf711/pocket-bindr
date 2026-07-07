import { z } from 'zod'
import { passwordSchema } from '@/lib/schemas/common'

/**
 * 單一真相：username 格式規則。
 * 原本定義於 src/app/api/user/username/route.ts 的 USERNAME_REGEX。
 */
export const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/

export const usernameSchema = z.string().regex(USERNAME_RE, 'USERNAME_INVALID')

/** POST /api/user/password：純 OAuth 使用者設定密碼（無 currentPassword） */
export const setPasswordSchema = z.object({
  newPassword: passwordSchema,
})

/** PATCH /api/user/password：修改既有密碼 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'INVALID_INPUT'),
  newPassword: passwordSchema,
})

export type SetPasswordInput = z.infer<typeof setPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/** POST /api/user/email/request：純 OAuth 使用者補填 email（需經驗證信確認所有權才寫入） */
export const addEmailSchema = z.object({
  email: z.string().min(1, 'INVALID_EMAIL').email('INVALID_EMAIL'),
})

export type AddEmailInput = z.infer<typeof addEmailSchema>
