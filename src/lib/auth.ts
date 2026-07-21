import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Discord from 'next-auth/providers/discord'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { verifyCredentials } from '@/lib/auth-utils'
import { authConfig } from '@/lib/auth.config'
import { resolveProviderEmailVerified } from '@/lib/oauth-email-verified'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    // OAuth 首登蓋 emailVerified。刻意掛在此處而非 auth.config.ts：後者是 Edge-safe
    // config（被 src/proxy.ts 的 middleware 共用），不得 import PrismaClient。
    //
    // 為何不在 provider 的 profile() 蓋章：@auth/core 的 OAuth 建帳號路徑寫死
    // `createUser({ ...profile, emailVerified: null })`，在 spread 之後無條件覆蓋，
    // profile() 回傳的值不可能落地（同檔的 magic-link / webauthn 路徑則無此覆蓋）。
    //
    // trigger === 'signIn' 時才拿得到原始 OAuth profile（OIDC 為解碼後的 ID Token）。
    // updateMany + `emailVerified: null` 條件使其冪等：已蓋章者 no-op、不刷新既有時間戳，
    // 且無需先讀 DB；既有 emailVerified 為 null 的 OAuth 使用者會在下次登入時自動補齊。
    async jwt(params) {
      const token = await authConfig.callbacks!.jwt!(params)

      const { trigger, account, profile } = params
      if (
        token?.sub &&
        trigger === 'signIn' &&
        resolveProviderEmailVerified(account?.provider, profile as Record<string, unknown> | undefined)
      ) {
        await prisma.user.updateMany({
          where: { id: token.sub, emailVerified: null },
          data: { emailVerified: new Date() },
        })
      }

      return token
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // ⚠️ 此處的 emailVerified 不具實效：@auth/core 的 OAuth createUser 會無條件
      // 覆蓋成 null（見上方 jwt callback 註解）。保留欄位僅為滿足 AdapterUser 型別，
      // 真正的蓋章在 jwt callback。要改蓋章條件請改 src/lib/oauth-email-verified.ts。
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
      // 頭像/顯示名邏輯照抄 @auth/core 預設 profile()（含無自訂頭像的 embed avatar 編號
      // 與動態頭像 gif 格式判斷），避免覆寫回歸既有行為。
      // ⚠️ emailVerified 同 Google，於此處不具實效，真正蓋章在 jwt callback。
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
