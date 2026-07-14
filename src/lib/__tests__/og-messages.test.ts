import { describe, it, expect } from 'vitest'
import { ogMessage } from '../og-messages'
import zhTW from '../../../messages/zh-TW.json'

describe('ogMessage', () => {
  it('一律回 zh-TW 文案，不受 cookie / Accept-Language 影響', () => {
    expect(ogMessage('home.tagline')).toBe(zhTW.home.tagline)
    expect(ogMessage('binder.defaultOwnerName')).toBe(zhTW.binder.defaultOwnerName)
  })

  it('ogBinderCount 的 {count} 插值正確', () => {
    const result = ogMessage('metadata.ogBinderCount', { count: 42 })
    expect(result).toBe(zhTW.metadata.ogBinderCount.replace('{count}', '42'))
    expect(result).toContain('42')
  })
})
