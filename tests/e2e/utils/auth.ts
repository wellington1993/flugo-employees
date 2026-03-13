import { expect, type Page } from '@playwright/test'

export async function ensureAuthenticated(page: Page) {
  await page.goto('/staffs')

  if (!page.url().includes('/login')) return

  const authEmail = `e2e.auth.${Date.now()}@flugo.test`
  const authPassword = 'E2EAuth123!'

  const signUpButton = page.getByRole('button', { name: /criar nova conta/i })
  if (await signUpButton.isVisible().catch(() => false)) {
    await signUpButton.click()
  }

  await page.getByLabel(/e-mail/i).fill(authEmail)
  await page.getByLabel(/senha/i).fill(authPassword)
  await page.getByRole('button', { name: /criar conta|entrar/i }).click()

  if (page.url().includes('/login')) {
    const bypassButton = page.getByRole('button', { name: /modo offline|bypass/i })
    if (await bypassButton.isVisible().catch(() => false)) {
      await bypassButton.click()
    }
  }

  await expect(page).toHaveURL(/\/staffs/, { timeout: 15000 })
}
