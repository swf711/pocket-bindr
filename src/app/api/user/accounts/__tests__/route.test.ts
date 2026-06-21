import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTransaction = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => unknown) => mockTransaction(fn),
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { DELETE } from '../[provider]/route'

function makeRequest(provider: string) {
  return new Request(`http://localhost/api/user/accounts/${provider}`, {
    method: 'DELETE',
  })
}

function makeParams(provider: string) {
  return { params: Promise.resolve({ provider }) }
}

describe('DELETE /api/user/accounts/[provider]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(makeRequest('google'), makeParams('google'))
    expect(res.status).toBe(401)
  })

  it('provider 不合法（twitter）回傳 400 INVALID_PROVIDER', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await DELETE(makeRequest('twitter'), makeParams('twitter'))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('INVALID_PROVIDER')
  })

  it('未綁定此 provider 回傳 404 NOT_LINKED', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        user: {
          findUnique: vi.fn().mockResolvedValue({
            passwordHash: 'hash',
            accounts: [{ provider: 'discord' }],
          }),
        },
        account: { deleteMany: vi.fn() },
      })
    )
    const res = await DELETE(makeRequest('google'), makeParams('google'))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('NOT_LINKED')
  })

  it('防鎖死：唯一 Account 且無 password → 409 lastLoginMethodRemoval', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        user: {
          findUnique: vi.fn().mockResolvedValue({
            passwordHash: null,
            accounts: [{ provider: 'google' }],
          }),
        },
        account: { deleteMany: vi.fn() },
      })
    )
    const res = await DELETE(makeRequest('google'), makeParams('google'))
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toBe('lastLoginMethodRemoval')
  })

  it('有 password 時可解綁唯一 Account → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const mockDeleteMany = vi.fn().mockResolvedValue({ count: 1 })
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        user: {
          findUnique: vi.fn().mockResolvedValue({
            passwordHash: 'hash',
            accounts: [{ provider: 'google' }],
          }),
        },
        account: { deleteMany: mockDeleteMany },
      })
    )
    const res = await DELETE(makeRequest('google'), makeParams('google'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1', provider: 'google' } })
  })

  it('有多個 Account 時可解綁其中一個 → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const mockDeleteMany = vi.fn().mockResolvedValue({ count: 1 })
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        user: {
          findUnique: vi.fn().mockResolvedValue({
            passwordHash: null,
            accounts: [{ provider: 'google' }, { provider: 'discord' }],
          }),
        },
        account: { deleteMany: mockDeleteMany },
      })
    )
    const res = await DELETE(makeRequest('google'), makeParams('google'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})
