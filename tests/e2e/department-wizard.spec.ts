import { test, expect } from '@playwright/test'
import { cleanupTestRecords } from './utils/cleanup'
import { ensureAuthenticated } from './utils/auth'

test.afterEach(async () => {
  await cleanupTestRecords()
})

test.describe('Wizard de departamento', () => {
  test('cria e edita departamento salvando colaboradores', async ({ page }) => {
    await ensureAuthenticated(page)

    const suffix = Date.now()
    const deptName = `E2E Dept Wizard ${suffix}`

    await page.goto('/departments/new')
    await page.getByLabel(/nome do departamento/i).fill(deptName)
    await page.getByLabel(/descrição/i).fill('Departamento criado por teste E2E')
    await page.getByRole('button', { name: /próximo passo/i }).click()
    await expect(page.getByText(/passo 2\/2/i)).toBeVisible()

    await page.getByRole('button', { name: /gerenciar colaboradores/i }).click()
    await expect(page.getByRole('heading', { name: /gerenciar colaboradores/i })).toBeVisible()
    const firstStaffOption = page.locator('[role="button"]').filter({ has: page.locator('text=/@/') }).first()
    if (await firstStaffOption.isVisible().catch(() => false)) {
      await firstStaffOption.click()
    }
    await page.getByRole('button', { name: /fechar painel/i }).click()

    await page.getByRole('button', { name: /salvar departamento/i }).click()
    await page.getByRole('button', { name: /confirmar e salvar/i }).click()

    await expect(page).toHaveURL(/\/departments/, { timeout: 15000 })
    await expect(page.getByText(deptName)).toBeVisible({ timeout: 15000 })

    const deptRow = page.locator('tr', { hasText: deptName })
    await deptRow.getByRole('button', { name: /editar/i }).click()
    await expect(page).toHaveURL(/\/departments\/.+\/edit/, { timeout: 10000 })
    await expect(page.getByLabel(/nome do departamento/i)).toHaveValue(deptName)
    await page.getByLabel(/descrição/i).fill('Departamento editado por teste E2E')
    await page.getByRole('button', { name: /próximo passo/i }).click()
    await expect(page.getByText(/passo 2\/2/i)).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /salvar departamento/i }).click()
    await page.getByRole('button', { name: /confirmar e salvar/i }).click()

    await expect(page).toHaveURL(/\/departments/, { timeout: 15000 })
    await expect(page.getByText(deptName)).toBeVisible()
  })
})
