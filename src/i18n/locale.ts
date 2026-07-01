// i18n locale definitions shared across server request config, the locale
// server action, and the client language switcher. Cookie/header strategy
// (next-intl "without i18n routing") — no [locale] route segment.

export const LOCALES = ['zh-TW', 'en', 'ja'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'zh-TW'

// Cookie name follows next-intl's convention so the switcher and request
// config agree on where the explicit user choice is persisted.
export const LOCALE_COOKIE = 'NEXT_LOCALE'

// Display labels shown in the language switcher (each in its own language).
export const LOCALE_LABELS: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  en: 'English',
  ja: '日本語',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value)
}

// Map an Accept-Language header to one of our supported locales.
// Honours quality weights (q=) and matches by primary subtag so that
// e.g. "en-US" → "en" and "ja-JP" → "ja"; anything else falls back to zh-TW.
export function matchAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='))
      const quality = q ? Number.parseFloat(q.slice(2)) : 1
      return { tag: tag.toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality }
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.quality - a.quality)

  for (const { tag } of ranked) {
    // Traditional Chinese variants → zh-TW; generic zh also maps to zh-TW
    // (our only Chinese locale). Simplified-only (zh-cn/zh-hans) still lands
    // on zh-TW as the closest available Chinese option.
    if (tag === 'zh-tw' || tag.startsWith('zh-hant') || tag === 'zh') {
      return 'zh-TW'
    }
    const primary = tag.split('-')[0]
    if (primary === 'ja') return 'ja'
    if (primary === 'en') return 'en'
    if (primary === 'zh') return 'zh-TW'
  }

  return DEFAULT_LOCALE
}

// Resolve the effective locale: an explicit cookie choice wins; otherwise
// fall back to Accept-Language detection (first visit); finally DEFAULT_LOCALE.
export function resolveLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (isLocale(cookieValue)) return cookieValue
  return matchAcceptLanguage(acceptLanguage)
}
