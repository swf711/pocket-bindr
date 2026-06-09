import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const protectedRoutes = ['/binders', '/settings']

export default auth((req) => {
  const isProtected = protectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  )
  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
