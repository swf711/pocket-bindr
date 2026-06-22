import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Discord from 'next-auth/providers/discord'
import Google from 'next-auth/providers/google'

const protectedRoutes = ['/binders', '/settings']

// Edge-safe config: no PrismaAdapter, no PrismaClient
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { prompt: 'none' } },
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      authorize: () => null, // real logic is in auth.ts
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isProtected = protectedRoutes.some(route =>
        nextUrl.pathname.startsWith(route)
      )
      if (isProtected) return !!auth?.user
      return true // allow public routes
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      if (token.name) session.user.name = token.name
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        // Prisma User uses 'username' not 'name'; map to token.name explicitly.
        // For OAuth users without a username, fall back to provider-supplied token.name.
        token.name =
          (user as { username?: string | null }).username ?? token.name ?? null
      }
      return token
    },
  },
}
