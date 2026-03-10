import { test, expect } from '@playwright/test'

test.describe('Resiliência e Sincronização Offline', () => {
  test.beforeEach(async ({ page }) => {
    // Começa na listagem e limpa o estado local
    await page.goto('/staffs')
    await page.evaluate(() => localStorage.clear())
  })

  test('cadastra colaborador offline e sincroniza ao voltar online', async ({ page, context }) => {
    const suffix = Date.now()
    const name = `Offline Staff ${suffix}`
    const email = `offline-${suffix}@empresa.com`

    // 1. Simular queda de rede (bloquear Firestore)
    await context.route('**/firestore.googleapis.com/**', route => route.abort())

    // 2. Tentar cadastrar
    await page.getByRole('button', { name: /Novo Colaborador/i }).click()
    await page.getByLabel(/Nome/i).fill(name)
    await page.getByLabel(/E-mail/i).fill(email)
    await page.getByRole('button', { name: /Próximo/i }).click()
    
    await page.getByLabel(/Departamento/i).click()
    await page.getByRole('option', { name: 'TI' }).click()
    await page.getByRole('button', { name: /Finalizar/i }).click()

    // 3. Verificar feedback de modo offline
    await expect(page.getByText(/Salvo no dispositivo|pendente/i)).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/\/staffs/, { timeout: 10000 })

    // 4. Verificar status "Sincronizando" na lista
    const row = page.locator('tr', { hasText: name })
    await expect(row.getByText(/Sincronizando|Pendente/i)).toBeVisible()

    // 5. Restaurar rede
    await context.unroute('**/firestore.googleapis.com/**')

    // 6. Sincronização automática deve ocorrer
    // O chip deve mudar para "Ativo"
    await expect(row.getByText('Ativo')).toBeVisible({ timeout: 30000 })
    await expect(row.getByText(/Sincronizando/i)).not.toBeVisible()
  })
})
