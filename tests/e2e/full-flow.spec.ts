import { test, expect } from '@playwright/test'
import { cleanupTestRecords } from './utils/cleanup'

test.afterEach(async () => {
  await cleanupTestRecords()
})

test.describe('Fluxo de Cadastro Online', () => {
  test('Fluxo completo do formulário', async ({ page }) => {
    await page.goto('/staffs')
    await expect(page.getByRole('heading', { name: /colaboradores/i })).toBeVisible({ timeout: 20000 })

    await page.getByRole('link', { name: /novo colaborador/i }).click()
    await expect(page).toHaveURL(/\/staffs\/new/)

    const timestamp = Date.now()
    const uniqueName = `Wellington Teste E2E ${timestamp}`
    const uniqueEmail = `e2e.${timestamp}@test.com`

    await page.getByLabel(/nome completo/i).fill(uniqueName)
    await page.getByLabel(/e-mail corporativo/i).fill(uniqueEmail)
    await page.getByRole('button', { name: /próximo passo/i }).click()

    await page.getByLabel(/selecione o departamento/i).click()
    await page.getByRole('option', { name: 'TI', exact: true }).click()
    await page.getByRole('button', { name: /finalizar cadastro/i }).click()

    await expect(
      page.getByText(/colaborador cadastrado com sucesso/i)
    ).toBeVisible({ timeout: 15000 })

    await expect(page).toHaveURL(/\/staffs$/, { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /colaboradores/i })).toBeVisible({ timeout: 10000 })

    await expect(page.getByRole('cell', { name: uniqueName })).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Fluxo de Cadastro Offline', () => {
  test('salva localmente e exibe status de sincronização', async ({ context, page }) => {
    // 1. Garante que a página carregue online primeiro para ter a aplicação disponível
    await page.goto('/staffs')
    await expect(page.getByRole('heading', { name: /colaboradores/i })).toBeVisible({ timeout: 20000 })

    // 2. Navega para o formulário
    await page.getByRole('link', { name: /novo colaborador/i }).click()
    await expect(page).toHaveURL(/\/staffs\/new/)

    // 3. Simula a perda de conexão de rede
    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))

    const timestamp = Date.now()
    const uniqueName = `Offline User ${timestamp}`
    const uniqueEmail = `offline.${timestamp}@test.com`

    // 4. Preenche e submete o formulário
    await page.getByLabel(/nome completo/i).fill(uniqueName)
    await page.getByLabel(/e-mail corporativo/i).fill(uniqueEmail)
    await page.getByRole('button', { name: /próximo passo/i }).click()

    await page.getByLabel(/selecione o departamento/i).click()
    await page.getByRole('option', { name: 'TI', exact: true }).click()
    await page.getByRole('button', { name: /finalizar cadastro/i }).click()

    // 5. Verifica se o toast de sucesso é exibido (mesmo offline)
    await expect(
      page.getByText(/colaborador cadastrado com sucesso/i)
    ).toBeVisible({ timeout: 15000 })

    // 6. Verifica se o redirecionamento para a lista acontece
    await expect(page).toHaveURL(/\/staffs$/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /colaboradores/i })).toBeVisible({ timeout: 10000 })

    // 7. Verifica se o novo usuário aparece na lista
    const userRow = page.locator('tr', { hasText: uniqueName })
    await expect(userRow).toBeVisible({ timeout: 10000 })
    await expect(userRow.getByText(/Ativo/i)).toBeVisible({ timeout: 5000 })

    // 8. Restaura a conexão
    await context.setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
  })
})
