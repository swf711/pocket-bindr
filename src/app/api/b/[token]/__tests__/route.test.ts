import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: { findUnique: vi.fn() },
  },
}))

import { GET } from '../route'
import { prisma } from '@/lib/prisma'

function makeContext(token: string) {
  return { params: Promise.resolve({ token }) }
}

const mockBinder = {
  id: 'b1',
  userId: 'u1',
  name: 'Public Binder',
  gridType: 'grid_3x3',
  coverColor: '#4A5568',
  description: 'My collection',
  settings: { totalPages: 2 },
  sortOrder: 0,
  shareToken: 'validtoken123',
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { username: 'trainer_ash' },
  slots: [
    {
      id: 'slot1',
      binderId: 'b1',
      cardId: 'c1',
      pageNumber: 1,
      slotIndex: 0,
      status: 'owned',
      card: {
        id: 'c1',
        name: 'Pikachu',
        imageSmall: '/img/pikachu.png',
        language: 'EN',
        cardNumber: '025',
        rarity: 'Common',
      },
    },
  ],
}

describe('GET /api/b/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('無效 token → 404', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(null)
    const res = await GET(new Request('http://localhost'), makeContext('invalidtoken'))
    expect(res.status).toBe(404)
  })

  it('有效 token → 200 並回傳 BinderPublicData', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    const res = await GET(new Request('http://localhost'), makeContext('validtoken123'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.id).toBe('b1')
    expect(data.name).toBe('Public Binder')
    expect(data.ownerName).toBe('trainer_ash')
    expect(data.slots).toHaveLength(1)
  })

  it('回應不含 userId', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(mockBinder as never)
    const res = await GET(new Request('http://localhost'), makeContext('validtoken123'))
    const data = await res.json()
    expect(data.userId).toBeUndefined()
  })

  it('username 為 null 時 ownerName fallback 為 "TCG 玩家"', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({
      ...mockBinder,
      user: { username: null },
    } as never)
    const res = await GET(new Request('http://localhost'), makeContext('validtoken123'))
    const data = await res.json()
    expect(data.ownerName).toBe('TCG 玩家')
  })

  it('settings.totalPages 取 max（settings vs 實際格位頁數）', async () => {
    const binderWithHigherSlotPage = {
      ...mockBinder,
      settings: { totalPages: 1 },
      slots: [{ ...mockBinder.slots[0], pageNumber: 3 }],
    }
    vi.mocked(prisma.binder.findUnique).mockResolvedValue(binderWithHigherSlotPage as never)
    const res = await GET(new Request('http://localhost'), makeContext('validtoken123'))
    const data = await res.json()
    expect(data.settings.totalPages).toBe(3)
  })

  it('無格位時 totalPages 至少為 1', async () => {
    vi.mocked(prisma.binder.findUnique).mockResolvedValue({
      ...mockBinder,
      settings: null,
      slots: [],
    } as never)
    const res = await GET(new Request('http://localhost'), makeContext('validtoken123'))
    const data = await res.json()
    expect(data.settings.totalPages).toBe(1)
  })
})
