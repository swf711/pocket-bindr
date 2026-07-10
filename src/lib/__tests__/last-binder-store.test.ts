import { describe, it, expect } from 'vitest'
import { getLastAddedBinderId, setLastAddedBinderId } from '../last-binder-store'

describe('last-binder-store', () => {
  it('setLastAddedBinderId 後 getLastAddedBinderId 回傳該 id', () => {
    setLastAddedBinderId('binder-abc')
    expect(getLastAddedBinderId()).toBe('binder-abc')
  })

  it('可覆寫為最新一次設定的 id', () => {
    setLastAddedBinderId('binder-1')
    setLastAddedBinderId('binder-2')
    expect(getLastAddedBinderId()).toBe('binder-2')
  })
})
