import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { JWT } from 'next-auth/jwt'
import type { NextAuthConfig } from 'next-auth'

// 攔截 NextAuth() 收到的 config，藉此取得 auth.ts 組合後的 jwt callback。
// next-auth 整包 mock 掉（不用 importOriginal）：其 lib/env.js 會 import 'next/server'，
// 在 vitest node 環境解析不到。
const h = vi.hoisted(() => ({
  captured: undefined as unknown,
  updateMany: vi.fn().mockResolvedValue({ count: 1 }),
}))

vi.mock('next-auth', () => ({
  default: vi.fn((config: unknown) => {
    h.captured = config
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }
  }),
}))

vi.mock('next-auth/providers/google', () => ({ default: vi.fn((o: unknown) => o) }))
vi.mock('next-auth/providers/discord', () => ({ default: vi.fn((o: unknown) => o) }))
vi.mock('next-auth/providers/credentials', () => ({ default: vi.fn((o: unknown) => o) }))
vi.mock('@auth/prisma-adapter', () => ({ PrismaAdapter: vi.fn(() => ({})) }))
vi.mock('@/lib/auth-utils', () => ({ verifyCredentials: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: { user: { updateMany: (...a: unknown[]) => h.updateMany(...a) } },
}))

import '@/lib/auth'

const updateMany = h.updateMany
const capturedConfig = () => h.captured as NextAuthConfig

type JwtParams = Parameters<NonNullable<NonNullable<NextAuthConfig['callbacks']>['jwt']>>[0]

async function runJwt(params: Partial<JwtParams>): Promise<JWT> {
  const jwt = capturedConfig().callbacks!.jwt!
  const result = await jwt({ token: {} as JWT, ...params } as JwtParams)
  return result as JWT
}

const GOOGLE_SIGNIN = {
  token: { sub: 'user-1' } as JWT,
  trigger: 'signIn' as const,
  account: { provider: 'google', providerAccountId: 'g1', type: 'oidc' as const },
}

describe('auth.ts jwt callback — OAuth emailVerified 蓋章', () => {
  beforeEach(() => updateMany.mockClear())

  it('google 且 email_verified:true → 蓋章（where 帶 emailVerified:null 保證冪等）', async () => {
    await runJwt({ ...GOOGLE_SIGNIN, profile: { email_verified: true } })

    expect(updateMany).toHaveBeenCalledTimes(1)
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', emailVerified: null },
      data: { emailVerified: expect.any(Date) },
    })
  })

  it('discord 且 verified:true → 蓋章', async () => {
    await runJwt({
      token: { sub: 'user-2' } as JWT,
      trigger: 'signIn',
      account: { provider: 'discord', providerAccountId: 'd1', type: 'oauth' },
      profile: { verified: true },
    })
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'user-2', emailVerified: null },
      data: { emailVerified: expect.any(Date) },
    })
  })

  it('google 但 email_verified:false → 不蓋章', async () => {
    await runJwt({ ...GOOGLE_SIGNIN, profile: { email_verified: false } })
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('discord 但 verified:false → 不蓋章（Discord 允許未驗證 email 帳號存在）', async () => {
    await runJwt({
      token: { sub: 'user-2' } as JWT,
      trigger: 'signIn',
      account: { provider: 'discord', providerAccountId: 'd1', type: 'oauth' },
      profile: { verified: false },
    })
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('credentials 登入 → 不蓋章（email 驗證由 verifyCredentials 把關）', async () => {
    await runJwt({
      token: { sub: 'user-3' } as JWT,
      trigger: 'signIn',
      account: { provider: 'credentials', providerAccountId: 'c1', type: 'credentials' },
      profile: undefined,
    })
    expect(updateMany).not.toHaveBeenCalled()
  })

  it("trigger 非 'signIn'（token refresh / update）→ 不蓋章", async () => {
    await runJwt({ ...GOOGLE_SIGNIN, trigger: undefined, profile: { email_verified: true } })
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('token.sub 缺失 → 不蓋章（無從定位 user）', async () => {
    await runJwt({ ...GOOGLE_SIGNIN, token: {} as JWT, profile: { email_verified: true } })
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('保留 authConfig 既有的顯示名映射（組合時未吃掉原 callback）', async () => {
    const token = await runJwt({
      ...GOOGLE_SIGNIN,
      token: {} as JWT,
      user: { id: 'u9', name: 'Provider Name' } as never,
      profile: { email_verified: true },
    })
    expect(token.sub).toBe('u9')
    expect(token.name).toBe('Provider Name')
    // sub 由原 callback 從 user.id 補上後，蓋章仍應執行
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'u9', emailVerified: null },
      data: { emailVerified: expect.any(Date) },
    })
  })
})
