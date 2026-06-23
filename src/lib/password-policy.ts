/**
 * 密碼政策共用模組（純函式，無 I/O）。
 *
 * - `isPasswordValid`：唯一被 server 端強制的硬性規則（min 8）。註冊與改密碼共用，避免規則漂移。
 * - `getPasswordStrength`：UI 強度提示，僅供顯示，不強制複雜度。
 */

export const MIN_PASSWORD_LENGTH = 8

/** 硬性規則：唯一被 server 強制的條件 */
export function isPasswordValid(pw: string): boolean {
  return typeof pw === 'string' && pw.length >= MIN_PASSWORD_LENGTH
}

export type PasswordStrength = {
  /** 0=太短 1=弱 2=中 3=強 */
  score: 0 | 1 | 2 | 3
  label: string
}

/**
 * 依長度與字元多樣性給出強度提示（不強制）。
 * 少於 MIN_PASSWORD_LENGTH 一律視為「太短」(score 0)。
 */
export function getPasswordStrength(pw: string): PasswordStrength {
  if (!isPasswordValid(pw)) return { score: 0, label: '太短' }

  let classes = 0
  if (/[a-z]/.test(pw)) classes++
  if (/[A-Z]/.test(pw)) classes++
  if (/[0-9]/.test(pw)) classes++
  if (/[^a-zA-Z0-9]/.test(pw)) classes++

  const points = classes + (pw.length >= 12 ? 1 : 0)

  if (points <= 1) return { score: 1, label: '弱' }
  if (points === 2) return { score: 2, label: '中' }
  return { score: 3, label: '強' }
}
