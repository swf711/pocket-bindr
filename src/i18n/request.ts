import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { LOCALE_COOKIE, resolveLocale, type Locale } from './locale'

// next-intl request config (cookie/header strategy, no i18n routing).
// Locale resolution order: explicit NEXT_LOCALE cookie → Accept-Language
// header (first visit) → DEFAULT_LOCALE. Runs per-request on the server for
// both Server and Client Component rendering.
export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const locale: Locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get('accept-language'),
  )

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
