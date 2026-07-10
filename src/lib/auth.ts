import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Discord from 'next-auth/providers/discord'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { verifyCredentials } from '@/lib/auth-utils'
import { authConfig } from '@/lib/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Google OIDC 的 email_verified 是唯一可信旗標；「有 email」不等於「已驗證 email」，
      // 未驗證時 emailVerified 留 null（只影響全新 createUser，不回填既有使用者）。
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        }
      },
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { prompt: 'none' } },
      // Discord 允許帳號存在未驗證 email，必讀 verified 旗標，不可因有 email 就蓋章。
      // 頭像/顯示名邏輯照抄 @auth/core 預設 profile()（含無自訂頭像的 embed avatar 編號
      // 與動態頭像 gif 格式判斷），僅新增 emailVerified 映射，避免覆寫回歸既有行為。
      profile(profile) {
        let imageUrl: string
        if (profile.avatar === null) {
          const defaultAvatarNumber =
            profile.discriminator === '0'
              ? Number(BigInt(profile.id) >> BigInt(22)) % 6
              : parseInt(profile.discriminator) % 5
          imageUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`
        } else {
          const format = profile.avatar.startsWith('a_') ? 'gif' : 'png'
          imageUrl = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`
        }
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image: imageUrl,
          emailVerified: profile.verified ? new Date() : null,
        }
      },
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        return verifyCredentials({
          email: credentials.email as string,
          password: credentials.password as string,
        })
      },
    }),
  ],
})
