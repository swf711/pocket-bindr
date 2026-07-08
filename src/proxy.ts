import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)
export { auth as proxy }

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
