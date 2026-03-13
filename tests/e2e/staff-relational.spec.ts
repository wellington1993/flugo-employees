import { test, expect } from '@playwright/test'

test.describe('Integridade Relacional', () => {
  test('Fluxo: criar departamento e vincular colaborador', async ({ page }) => {
    // 1. Criar Departamento
    await page.goto('/departments')
    await page.getByRole('button', { name: /novo departamento/i }).click()
    const deptName = `Depto ${Date.now()}`
    await page.getByLabel(/nome do departamento/i).fill(deptName)
    await page.getByRole('button', { name: /salvar/i }).click()
    await expect(page.getByText(deptName)).toBeVisible({ timeout: 10000 })

    // 2. Criar Colaborador vinculado
    await page.goto('/staffs/new')
    const staffName = `Colab ${Date.now()}`
    await page.getByLabel(/nome completo/i).fill(staffName)
    await page.getByLabel(/e-mail corporativo/i).fill(`test.${Date.now()}@flugo.com`)
    await page.getByRole('button', { name: /próximo/i }).click()

    // Selecionar Departamento recém-criado
    await page.getByLabel(/selecione o departamento/i).click()
    await page.getByRole('option', { name: deptName }).click()
    
    await page.getByLabel(/cargo/i).fill('Analista')
    await page.getByLabel(/data de admissão/i).fill('2024-03-13')
    await page.getByLabel(/nível hierárquico/i).click()
    await page.getByRole('option', { name: 'MID' }).click()
    await page.getByLabel(/salário base/i).fill('5000')
    
    await page.getByRole('button', { name: /finalizar/i }).click()

    // 3. Validar na listagem
    await expect(page).toHaveURL(/\/staffs/)
    await expect(page.getByText(staffName)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(deptName)).toBeVisible()
  })
})
