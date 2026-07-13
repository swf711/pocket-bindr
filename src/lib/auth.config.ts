import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Discord from 'next-auth/providers/discord'
import Google from 'next-auth/providers/google'

export const protectedRoutes = ['/binders', '/settings', '/collection']

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
      session.user.image = (token.picture as string | null | undefined) ?? null
      return session
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id
        // Prisma User has no 'name' for credentials users (uses 'username'); OAuth users
        // have no 'username' (PrismaAdapter writes provider name into User.name).
        // Display-name precedence: username → User.name → existing token.name.
        const u = user as { username?: string | null; name?: string | null }
        token.name = u.username ?? u.name ?? token.name ?? null
      }
      // Client 呼叫 useSession().update({ image }) 時觸發，讓頭像上傳/移除後不必重登
      // 即可反映於 token（session.user.image 來自 token.picture，見上方 session callback）。
      if (trigger === 'update' && session && 'image' in session) {
        token.picture = (session as { image?: string | null }).image
      }
      // 同上，讓 username 改名後不必重登即可反映於 token.name（Header 顯示名來源）。
      if (trigger === 'update' && session && 'name' in session) {
        token.name = (session as { name?: string | null }).name ?? null
      }
      return token
    },
  },
}
