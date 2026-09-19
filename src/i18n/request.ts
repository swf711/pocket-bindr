import { getRequestConfig } from 'next-intl/server'
import { DEFAULT_LOCALE, isLocale, type Locale } from './locale'

// Locale comes from the [locale] route segment: setRequestLocale() in layouts/pages,
// or the X-NEXT-INTL-LOCALE header set by src/proxy.ts. Deliberately does NOT read
// cookies()/headers() here — doing so made every route dynamic.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: Locale = isLocale(requested) ? requested : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
