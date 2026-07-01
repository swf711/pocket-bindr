'use server'

import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isLocale, type Locale } from './locale'

// Persist the user's explicit language choice. The client switcher calls this
// then router.refresh() so Server Components re-render with the new locale.
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
}
