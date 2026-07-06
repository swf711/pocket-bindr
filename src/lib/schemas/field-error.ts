/**
 * 把 react-hook-form 的 fieldState.error（message 存的是 zod schema 填入的
 * 穩定 error code，如 'PASSWORD_TOO_SHORT'）解析成 next-intl 的翻譯字串。
 *
 * 未知 code（理論上不該發生，但避免因漏填 i18n key 而整頁炸掉）一律 fallback
 * 到 `validation.generic`。
 */

type FieldErrorLike = { message?: string } | undefined

/**
 * next-intl 的 `useTranslations()` 回傳型別對「未知 key」在型別上不允許任意字串，
 * 這裡用最小必要的呼叫簽名，讓呼叫端可以直接傳 `useTranslations()` 或
 * `useTranslations('validation')` 的結果都能用（後者請改傳 code 本身，不含 'validation.' 前綴）。
 */
type Translator = (key: string) => string

const FALLBACK_KEY = 'validation.generic'

export function resolveFieldError(
  error: FieldErrorLike,
  t: Translator,
): string | undefined {
  const code = error?.message
  if (!code) return undefined

  const key = code.startsWith('validation.') ? code : `validation.${code}`

  try {
    const resolved = t(key)
    // next-intl 在開發模式下對缺失 key 可能回傳 key 本身而非 throw；
    // 這種情況一併 fallback，避免使用者看到原始 error code。
    if (resolved === key) {
      return t(FALLBACK_KEY)
    }
    return resolved
  } catch {
    return t(FALLBACK_KEY)
  }
}
