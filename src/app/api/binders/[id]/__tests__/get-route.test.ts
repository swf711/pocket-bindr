import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    binder: {
      findUnique: vi.fn(),
    },
  },
}))

const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

import { GET } from '../route'
import { prisma } from '@/lib/prisma'

const mockBinder = {
  id: 'binder-1',
  userId: 'user-1',
  name: '測試卡冊',
  gridType: 'grid_3x3',
  coverColor: '#4A5568',
  settings: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockCard = {
  id: 'card-1',
  name: 'Pikachu',
  imageSmall: 'https://images.pokemontcg.io/base1/58_hires.png',
  language: 'EN' as const,
  cardNumber: '58',
  rarity: 'Common',
}

const mockSlot = {
  id: 'slot-1',
  binderId: 'binder-1',
  cardId: 'card-1',
  pageNumber: 1,
  slotIndex: 0,
  status: 'owned' as const,
  card: mockCard,
}

describe('GET /api/binders/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('未登入回傳 401', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'binder-1' }),
    })
    expect(res.status).toBe(401)
  })

  it('他人卡冊回傳 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique)
      .mockResolvedValueOnce({ ...mockBinder, userId: 'other-user' } as never)
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'binder-1' }),
    })
    expect(res.status).toBe(403)
  })

  it('不存在的卡冊回傳 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique).mockResolvedValueOnce(null)
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'binder-1' }),
    })
    expect(res.status).toBe(404)
  })

  it('正確回傳 binder + slots + card 資料', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique)
      .mockResolvedValueOnce(mockBinder as never)
      .mockResolvedValueOnce({
        ...mockBinder,
        slots: [mockSlot],
      } as never)
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'binder-1' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('binder-1')
    expect(data.slots).toHaveLength(1)
    expect(data.slots[0].card.name).toBe('Pikachu')
  })

  it('OPCG ZH_TW alias 格位以顯示卡（ZH_TW）呈現，cardId 為顯示卡 id', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    const aliasSlot = {
      id: 'slot-2',
      binderId: 'binder-1',
      cardId: 'ja-1',
      displayCardId: 'zh-1',
      pageNumber: 1,
      slotIndex: 1,
      status: 'owned' as const,
      card: { id: 'ja-1', name: 'ルフィ', imageSmall: 'ja.png', language: 'JA' as const, cardNumber: 'OP01-001', rarity: null },
      displayCard: { id: 'zh-1', name: '魯夫', imageSmall: 'ja.png', language: 'ZH_TW' as const, cardNumber: 'OP01-001', rarity: null },
    }
    vi.mocked(prisma.binder.findUnique)
      .mockResolvedValueOnce(mockBinder as never)
      .mockResolvedValueOnce({ ...mockBinder, slots: [aliasSlot] } as never)
    const res = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'binder-1' }),
    })
    const data = await res.json()
    expect(data.slots[0].card.language).toBe('ZH_TW')
    expect(data.slots[0].card.name).toBe('魯夫')
    expect(data.slots[0].cardId).toBe('zh-1')
  })

  it('slots 的 include 使用 pageNumber ASC, slotIndex ASC 排序', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    vi.mocked(prisma.binder.findUnique)
      .mockResolvedValueOnce(mockBinder as never)
      .mockResolvedValueOnce({ ...mockBinder, slots: [] } as never)
    await GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'binder-1' }),
    })
    const secondCall = vi.mocked(prisma.binder.findUnique).mock.calls[1]
    const orderBy = (secondCall[0] as { include?: { slots?: { orderBy?: unknown } } }).include?.slots?.orderBy
    expect(orderBy).toEqual([{ pageNumber: 'asc' }, { slotIndex: 'asc' }])
  })
})
