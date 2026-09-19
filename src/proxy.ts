import NextAuth from 'next-auth'
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'
import { authConfig, protectedRoutes } from '@/lib/auth.config'
import { LOCALE_COOKIE, resolveLocale } from '@/i18n/locale'

const { auth } = NextAuth(authConfig)

// next-intl reads this request header when a page did not call setRequestLocale.
const INTL_LOCALE_HEADER = 'X-NEXT-INTL-LOCALE'

// Internally every page lives under src/app/[locale]/, but public URLs carry no
// locale prefix (same effect as next-intl's localePrefix: 'never'). Resolution
// reuses our own resolveLocale so the zh-Hant / zh → zh-TW mapping is unchanged.
function rewriteToLocale(req: NextRequest): NextResponse {
  const locale = resolveLocale(
    req.cookies.get(LOCALE_COOKIE)?.value,
    req.headers.get('accept-language'),
  )
  const url = req.nextUrl.clone()
  url.pathname = `/${locale}${req.nextUrl.pathname === '/' ? '' : req.nextUrl.pathname}`
  const headers = new Headers(req.headers)
  headers.set(INTL_LOCALE_HEADER, locale)
  return NextResponse.rewrite(url, { request: { headers } })
}

function isProtectedPath(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

// ⚠️ When NextAuth wraps a handler, a false `authorized` result does NOT redirect by
// itself — the handler always runs — so the sign-in redirect is done here explicitly.
const protectedProxy = auth((req) => {
  if (!req.auth?.user) {
    const signInUrl = req.nextUrl.clone()
    signInUrl.pathname = authConfig.pages?.signIn ?? '/login'
    signInUrl.search = ''
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.href)
    return NextResponse.redirect(signInUrl)
  }
  return rewriteToLocale(req)
})

// NextAuth only runs on protected routes: it re-issues the session cookie on every
// response it handles, and it costs a JWT decrypt per request. Public routes get the
// locale rewrite only.
export function proxy(req: NextRequest, ev: NextFetchEvent) {
  if (isProtectedPath(req.nextUrl.pathname)) {
    return (protectedProxy as unknown as (r: NextRequest, e: NextFetchEvent) => Promise<Response>)(req, ev)
  }
  return rewriteToLocale(req)
}

// Everything except routes that stay at the app root (api, SEO routes, root OG image)
// and static files. 🔴 Must be a literal (Next analyses it at build time).
export const config = {
  matcher: [
    '/((?!api/|_next/|sitemap\\.xml|sitemaps/|robots\\.txt|opengraph-image|.*\\.(?:ico|png|jpe?g|gif|svg|webp|otf|woff2?|txt|xml|json|webmanifest)$).*)',
  ],
}
