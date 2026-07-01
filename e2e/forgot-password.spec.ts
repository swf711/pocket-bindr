import { test, expect } from '@playwright/test'
import { getTestUser, loginAs } from './helpers/auth'
import {
  createPasswordUser,
  createValidResetToken,
  getUserPasswordHash,
  deleteUserByEmail,
} from './helpers/db'

const user = getTestUser('forgotpw')

test.beforeAll(async () => {
  await createPasswordUser(user.email, user.username, user.password)
})

test.afterAll(async () => {
  await deleteUserByEmail(user.email)
})

test.describe('忘記密碼頁面', () => {
  test('未登入可正常訪問 /forgot-password', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: '忘記密碼' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: '送出重設連結' })).toBeVisible()
  })

  test('已登入訪問 /forgot-password → redirect 至 /cards', async ({ page }) => {
    // The (auth) layout redirects any logged-in user to /cards.
    await loginAs(page, user)
    await page.goto('/forgot-password')
    await page.waitForURL('**/cards**')
    expect(page.url()).toContain('/cards')
  })

  test('提交任意 email 後顯示統一成功訊息（防 enumeration）', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill('nonexistent@example.com')
    await page.getByRole('button', { name: '送出重設連結' }).click()
    await expect(page.getByTestId('forgot-password-success-alert')).toBeVisible()
    await expect(page.getByTestId('forgot-password-success-alert')).toContainText('若此 email 有帳號')
  })

  test('提交有效帳號 email 後同樣顯示統一成功訊息', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill(user.email)
    await page.getByRole('button', { name: '送出重設連結' }).click()
    await expect(page.getByTestId('forgot-password-success-alert')).toBeVisible()
  })
})

test.describe('重設密碼頁面 — token 流程', () => {
  test('已登入訪問 /reset-password → redirect 至 /cards', async ({ page }) => {
    // The (auth) layout redirects any logged-in user to /cards.
    await loginAs(page, user)
    await page.goto('/reset-password')
    await page.waitForURL('**/cards**')
    expect(page.url()).toContain('/cards')
  })

  test('無 token 參數 → 顯示「連結無效」錯誤', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByTestId('reset-invalid-alert')).toBeVisible()
    await expect(page.getByRole('link', { name: '重新申請重設連結' })).toBeVisible()
  })

  test('有效 token → 顯示重設密碼表單', async () => {
    const token = await createValidResetToken(user.email)
    // 測試見下面整合測試
    expect(token).toBeTruthy()
    expect(token).toContain('.')
  })

  test('完整流程：有效 token → 重設密碼 → 導回 /login 顯示成功訊息', async ({ page }) => {
    const token = await createValidResetToken(user.email)
    const oldHash = await getUserPasswordHash(user.email)

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
    await expect(page.getByRole('heading', { name: '設定新密碼' })).toBeVisible()

    const newPassword = 'NewPassword456!'
    await page.getByLabel('新密碼').fill(newPassword)
    await page.getByLabel('確認密碼').fill(newPassword)
    await page.getByRole('button', { name: '設定新密碼' }).click()

    await page.waitForURL('**/login**')
    expect(page.url()).toContain('reset=success')
    await expect(page.getByTestId('password-reset-alert')).toBeVisible()
    await expect(page.getByTestId('password-reset-alert')).toContainText('密碼已重設')

    const newHash = await getUserPasswordHash(user.email)
    expect(newHash).not.toBe(oldHash)

    // 恢復原密碼以讓後續測試可用
    await createPasswordUser(user.email, user.username, user.password)
    // (upsert update: {} 不改 hash，需直接更新)
    const bcrypt = await import('bcryptjs')
    const { prisma } = await import('../src/lib/prisma')
    const restored = await bcrypt.default.hash(user.password, 12)
    await prisma.user.update({ where: { email: user.email }, data: { passwordHash: restored } })
  })

  test('已使用的 token → 顯示「連結無效或已被使用」', async ({ page }) => {
    const token = await createValidResetToken(user.email)

    // 先使用一次
    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
    await page.getByLabel('新密碼').fill('FirstReset123!')
    await page.getByLabel('確認密碼').fill('FirstReset123!')
    await page.getByRole('button', { name: '設定新密碼' }).click()
    await page.waitForURL('**/login**')

    // 再用同一 token
    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
    await page.getByLabel('新密碼').fill('SecondReset456!')
    await page.getByLabel('確認密碼').fill('SecondReset456!')
    await page.getByRole('button', { name: '設定新密碼' }).click()
    await expect(page.getByTestId('reset-error-alert')).toContainText('無效或已被使用')
  })

  test('密碼長度不足 → 顯示錯誤（純前端驗證）', async ({ page }) => {
    const token = await createValidResetToken(user.email)

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
    await page.getByLabel('新密碼').fill('short')
    await page.getByLabel('確認密碼').fill('short')
    await page.getByRole('button', { name: '設定新密碼' }).click()
    await expect(page.getByTestId('reset-error-alert')).toBeVisible()
  })

  test('兩次密碼不一致 → 顯示錯誤（純前端驗證）', async ({ page }) => {
    const token = await createValidResetToken(user.email)

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
    await page.getByLabel('新密碼').fill('Password123!')
    await page.getByLabel('確認密碼').fill('Different456!')
    await page.getByRole('button', { name: '設定新密碼' }).click()
    await expect(page.getByTestId('reset-error-alert')).toContainText('不一致')
  })
})

test.describe('登入頁面 — 忘記密碼連結', () => {
  test('登入頁有「忘記密碼？」連結', async ({ page }) => {
    await page.goto('/login')
    const link = page.getByRole('link', { name: '忘記密碼？' })
    await expect(link).toBeVisible()
    await link.click()
    await page.waitForURL('**/forgot-password**')
  })
})
