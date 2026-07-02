import { describe, it, expect, vi } from 'vitest'
import { authConfig } from '@/lib/auth.config'
import type { JWT } from 'next-auth/jwt'
import type { User } from 'next-auth'

// Helper to invoke the jwt callback with proper typing without pulling the full
// NextAuth call signature (trigger/account/etc. are optional at runtime here).
async function runJwt(
  token: JWT,
  user?: Partial<User> & { username?: string | null },
): Promise<JWT> {
  const jwt = authConfig.callbacks!.jwt!
  const result = await jwt({ token, user: user as User } as Parameters<typeof jwt>[0])
  return result!
}

describe('authConfig.jwt callback — display-name mapping', () => {
  it('Credentials 使用者：username 優先映射至 token.name', async () => {
    const token = await runJwt({} as JWT, {
      id: 'u1',
      username: 'cred_user',
      name: null,
    })
    expect(token.sub).toBe('u1')
    expect(token.name).toBe('cred_user')
  })

  it('OAuth 新使用者（username=null, name=provider名）：退回 user.name', async () => {
    const token = await runJwt({} as JWT, {
      id: 'u2',
      username: null,
      name: 'Brian (Google)',
    })
    expect(token.name).toBe('Brian (Google)')
  })

  it('username 與 name 皆 null：退回既有 token.name', async () => {
    const token = await runJwt({ name: 'existing' } as JWT, {
      id: 'u3',
      username: null,
      name: null,
    })
    expect(token.name).toBe('existing')
  })

  it('全部 null：token.name = null', async () => {
    const token = await runJwt({} as JWT, { id: 'u4', username: null, name: null })
    expect(token.name).toBeNull()
  })

  it('無 user（後續 refresh）：保留既有 token、不覆寫 name', async () => {
    const token = await runJwt({ sub: 'u5', name: 'keep' } as JWT)
    expect(token.sub).toBe('u5')
    expect(token.name).toBe('keep')
  })
})

// Contract test: the standard @auth/prisma-adapter createUser forwards the
// provider profile (name/email/emailVerified/image) straight to user.create.
// This is the call that broke production until User.name existed in the schema.
describe('PrismaAdapter.createUser — provider payload contract', () => {
  it('將 provider 的 name 轉交給 prisma.user.create', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'new-id' })
    const { PrismaAdapter } = await import('@auth/prisma-adapter')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = PrismaAdapter({ user: { create } } as any)

    await adapter.createUser!({
      id: 'ignored',
      name: 'OAuth User',
      email: 'new@oauth.test',
      emailVerified: null,
      image: null,
    })

    expect(create).toHaveBeenCalledTimes(1)
    expect(create.mock.calls[0][0]).toMatchObject({
      data: { name: 'OAuth User', email: 'new@oauth.test' },
    })
  })
})
