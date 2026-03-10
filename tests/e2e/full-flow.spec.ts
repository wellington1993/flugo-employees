import { test, expect } from '@playwright/test'

test.describe('Fluxo de Cadastro', () => {
  test('Fluxo completo do formulário', async ({ page }) => {
    // 1. Acessa e aguarda o carregamento inicial (lazy load)
    await page.goto('/staffs')
    
    // Aguarda o título da página ou o botão aparecer (resiliência para lazy load)
    await expect(page.getByRole('heading', { name: /colaboradores/i })).toBeVisible({ timeout: 20000 })

    // 2. Clica no botão
    const btnNovo = page.getByRole('button', { name: /novo colaborador/i })
    await btnNovo.click()

    // 3. Preenche o Passo 0: Infos Básicas
    await expect(page).toHaveURL(/\/staffs\/new/)
    await page.getByLabel(/nome/i).fill('Wellington Teste E2E')
    await page.getByLabel(/e-mail/i).fill(`e2e.${Date.now()}@test.com`)
    await page.getByRole('button', { name: /próximo/i }).click()

    // 4. Preenche o Passo 1: Infos Profissionais
    await page.getByLabel(/departamento/i).click()
    await page.getByRole('option', { name: /ti/i }).click()
    await page.getByRole('button', { name: /salvar/i }).click()

    // 5. Validação final na listagem
    await expect(page).toHaveURL(/\/staffs/, { timeout: 15000 })
    await expect(page.getByText('Wellington Teste E2E')).toBeVisible({ timeout: 15000 })
  })
})
