import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { envInt, envWindow } from '@/lib/rate-limit'

const ENV_KEY = 'RL_TEST_ENV_HELPER'

describe('envInt', () => {
  afterEach(() => {
    delete process.env[ENV_KEY]
  })

  it('有效正整數字串 → 採用該值', () => {
    process.env[ENV_KEY] = '42'
    expect(envInt(ENV_KEY, 10)).toBe(42)
  })

  it('未設定 env → 用 fallback', () => {
    expect(envInt(ENV_KEY, 10)).toBe(10)
  })

  it('非數字字串 → 用 fallback', () => {
    process.env[ENV_KEY] = 'not-a-number'
    expect(envInt(ENV_KEY, 10)).toBe(10)
  })

  it('0 或負數 → 用 fallback', () => {
    process.env[ENV_KEY] = '0'
    expect(envInt(ENV_KEY, 10)).toBe(10)
    process.env[ENV_KEY] = '-5'
    expect(envInt(ENV_KEY, 10)).toBe(10)
  })
})

describe('envWindow', () => {
  beforeEach(() => {
    delete process.env[ENV_KEY]
  })
  afterEach(() => {
    delete process.env[ENV_KEY]
  })

  it('合法格式（數字 + 單位）→ 採用該值', () => {
    process.env[ENV_KEY] = '5 m'
    expect(envWindow(ENV_KEY, '1 m')).toBe('5 m')
  })

  it('未設定 env → 用 fallback', () => {
    expect(envWindow(ENV_KEY, '1 m')).toBe('1 m')
  })

  it('不符合格式（如缺單位）→ 用 fallback', () => {
    process.env[ENV_KEY] = '5'
    expect(envWindow(ENV_KEY, '1 m')).toBe('1 m')
  })

  it('不支援的單位 → 用 fallback', () => {
    process.env[ENV_KEY] = '5 y'
    expect(envWindow(ENV_KEY, '1 m')).toBe('1 m')
  })
})
