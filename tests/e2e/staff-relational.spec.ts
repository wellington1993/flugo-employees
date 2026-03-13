import { test, expect } from '@playwright/test'

test.describe('Relacionamento Staff-Departamento', () => {
  test('deve criar colaborador vinculado a um departamento', async ({ page }) => {
    await page.goto('/staffs/new')
    await page.getByLabel(/nome/i).fill('Relational Staff Test')
    await page.getByLabel(/e-mail/i).fill(`test-${Date.now()}@flugo.com`)
    await page.getByRole('button', { name: /próximo/i }).click()
    
    await page.getByLabel(/selecione o departamento/i).click()
    await page.getByRole('option').first().click()
    await page.getByLabel(/cargo/i).fill('Dev Senior')
    await page.getByLabel(/data de admissão/i).fill('2024-03-13')
    await page.getByLabel(/nível hierárquico/i).click()
    await page.getByRole('option', { name: 'SENIOR' }).click()
    await page.getByLabel(/salário base/i).fill('15000')
    
    await page.getByRole('button', { name: /finalizar/i }).click()
    await expect(page.getByText(/sucesso/i)).toBeVisible()
  })
})
