import { Language } from '@prisma/client'

export const DEFAULT_LANGUAGE: Language = Language.EN

/**
 * Parses a language query param value.
 * - Returns DEFAULT_LANGUAGE (EN) when the param is missing or empty.
 * - Returns the matching Language enum value when valid (EN / JA / ZH_TW).
 * - Returns null when the value is invalid (caller should respond 400).
 */
export function parseLanguage(value: string | null): Language | null {
  if (!value) return DEFAULT_LANGUAGE
  if (Object.values(Language).includes(value as Language)) {
    return value as Language
  }
  return null
}
