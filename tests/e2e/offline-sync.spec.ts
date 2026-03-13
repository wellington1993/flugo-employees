import { test, expect } from '@playwright/test'
import { cleanupTestRecords } from './utils/cleanup'
import { ensureAuthenticated } from './utils/auth'

test.afterEach(async () => {
  await cleanupTestRecords()
})

test.describe('Resiliência e Sincronização Offline', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page)
    await page.evaluate(() => localStorage.clear())
  })

  test('cadastra colaborador offline e sincroniza ao voltar online', async ({ page, context }) => {
    const suffix = Date.now()
    const name = `Offline Staff ${suffix}`
    const email = `offline-${suffix}@empresa.com`

    // 1. Navegar para o formulário antes de simular offline (evita interferência do listener Firestore na lista)
    await page.getByRole('link', { name: /Novo Colaborador/i }).click()
    await expect(page).toHaveURL(/\/staffs\/new/)

    // 2. Simular queda de rede
    await context.setOffline(true)
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true })
      window.dispatchEvent(new Event('offline'))
    })

    await page.getByLabel(/Nome Completo/i).fill(name)
    await page.getByLabel(/E-mail Corporativo/i).fill(email)
    await page.getByRole('button', { name: /Próximo Passo/i }).click()
    
    await page.getByLabel(/Selecione o Departamento/i).click()
    await page.getByRole('option', { name: 'TI', exact: true }).click()
    await page.getByRole('button', { name: /Finalizar Cadastro/i }).click()

    // 3. Verificar feedback de sucesso (igual ao online)
    await expect(page.getByText(/colaborador cadastrado com sucesso/i)).toBeVisible({ timeout: 15000 })
    
    // 4. Verificar redirecionamento automático
    await expect(page).toHaveURL(/\/staffs/, { timeout: 10000 })

    // 5. Verifica se o novo usuário aparece na lista com status correto
    const row = page.locator('tr', { hasText: name })
    await expect(row).toBeVisible({ timeout: 10000 })
    await expect(row.getByText('Ativo')).toBeVisible({ timeout: 5000 })

    // 6. Restaurar rede
    await context.setOffline(false)
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => true, configurable: true })
      window.dispatchEvent(new Event('online'))
    })

    // 7. Registro deve permanecer visível e Ativo após sincronizar em background
    await expect(row).toBeVisible({ timeout: 15000 })
    await expect(row.getByText('Ativo')).toBeVisible({ timeout: 15000 })
  })
})
