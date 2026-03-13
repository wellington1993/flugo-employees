import { test, expect } from '@playwright/test'
import { cleanupTestRecords } from './utils/cleanup'
import { ensureAuthenticated } from './utils/auth'

test.afterEach(async () => {
  await cleanupTestRecords()
})

async function clickNovoColaborador(page: import('@playwright/test').Page) {
  await page.locator('a:has-text("Novo Colaborador"),button:has-text("Novo Colaborador")').first().click()
}

test.describe('Listagem de colaboradores', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page)
  })

  test('exibe tabela com as colunas corretas', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Colaborador' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'E-mail' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Departamento' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  })
})

test.describe('Cadastro de colaborador', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page)
    await page.evaluate(() => localStorage.clear())
  })

  test('cria colaborador com status Ativo', async ({ page }) => {
    const suffix = Date.now()
    const name = `Teste Ativo ${suffix}`
    const email = `ativo-${suffix}@empresa.com`

    await clickNovoColaborador(page)
    await page.getByLabel(/nome completo/i).fill(name)
    await page.getByLabel(/e-mail corporativo/i).fill(email)
    await page.getByRole('button', { name: /Próximo/i }).click()
    await page.getByLabel(/selecione o departamento/i).click()
    await page.getByRole('option', { name: 'TI', exact: true }).click()
    await page.getByRole('button', { name: /finalizar cadastro/i }).click()

    await expect(page.getByText(/sucesso/i)).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/\/staffs/, { timeout: 10000 })
    const newRow = page.locator('tr', { hasText: name })
    await expect(newRow).toBeVisible()
    await expect(newRow.locator('td').last()).toHaveText(/^Ativo$/)
  })

  test('cria colaborador com status Inativo', async ({ page }) => {
    const suffix = Date.now()
    const name = `Teste Inativo ${suffix}`
    const email = `inativo-${suffix}@empresa.com`

    await clickNovoColaborador(page)
    await page.getByLabel(/nome completo/i).fill(name)
    await page.getByLabel(/e-mail corporativo/i).fill(email)
    await page.getByRole('switch').click()
    await page.getByRole('button', { name: /Próximo/i }).click()
    await page.getByLabel(/selecione o departamento/i).click()
    await page.getByRole('option', { name: 'Design', exact: true }).click()
    await page.getByRole('button', { name: /finalizar cadastro/i }).click()

    await expect(page.getByText(/sucesso|local/i)).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/\/staffs/, { timeout: 10000 })
    await expect(page.getByText(name)).toBeVisible()
  })

  test('bloqueia avanço com nome menor que 3 caracteres', async ({ page }) => {
    await clickNovoColaborador(page)
    await page.getByLabel(/nome completo/i).fill('AB')
    await page.getByLabel(/e-mail corporativo/i).fill('valido@empresa.com')
    await page.getByRole('button', { name: /Próximo/i }).click()

    await expect(page.getByText(/pelo menos 3/i)).toBeVisible()
    await expect(page.getByText('Informações Básicas')).toBeVisible()
  })

  test('bloqueia avanço com e-mail inválido', async ({ page }) => {
    await clickNovoColaborador(page)
    await page.getByLabel(/nome completo/i).fill('Nome Válido')
    await page.getByLabel(/e-mail corporativo/i).fill('nao-e-email')
    await page.getByRole('button', { name: /Próximo/i }).click()

    await expect(page.getByText(/e-mail válido/i)).toBeVisible()
    await expect(page.getByText('Informações Básicas')).toBeVisible()
  })

  test('Voltar no passo 2 preserva campos do passo 1', async ({ page }) => {
    const name = 'Nome Preservado'
    const email = `preservado-${Date.now()}@empresa.com`

    await clickNovoColaborador(page)
    await page.getByLabel(/nome completo/i).fill(name)
    await page.getByLabel(/e-mail corporativo/i).fill(email)
    await page.getByRole('button', { name: /Próximo/i }).click()
    await expect(page.getByText('Informações Profissionais')).toBeVisible()
    await page.getByRole('button', { name: /Voltar/i }).click()

    await expect(page.getByLabel(/nome completo/i)).toHaveValue(name)
    await expect(page.getByLabel(/e-mail corporativo/i)).toHaveValue(email)
  })

  test('rejeita e-mail já cadastrado localmente', async ({ page }) => {
    const suffix = Date.now()
    const email = `dup-${suffix}@empresa.com`

    await clickNovoColaborador(page)
    await page.getByLabel(/nome completo/i).fill(`Primeiro ${suffix}`)
    await page.getByLabel(/e-mail corporativo/i).fill(email)
    await page.getByRole('button', { name: /Próximo/i }).click()
    await page.getByLabel(/selecione o departamento/i).click()
    await page.getByRole('option', { name: 'TI', exact: true }).click()
    await page.getByRole('button', { name: /finalizar cadastro/i }).click()
    await expect(page.getByText(/colaborador cadastrado com sucesso|salvo no dispositivo/i)).toBeVisible({ timeout: 15000 })

    // Aguarda o registro aparecer na lista (garante cache TanStack Query populado)
    await expect(page.getByText(`Primeiro ${suffix}`)).toBeVisible({ timeout: 15000 })
    // Navega via SPA para preservar o cache de staffs
    await clickNovoColaborador(page)
    await page.getByLabel(/nome completo/i).fill(`Segundo ${suffix}`)
    await page.getByLabel(/e-mail corporativo/i).fill(email)
    await page.getByRole('button', { name: /Próximo/i }).click()

    await expect(page.getByText(/já está em uso/i)).toBeVisible({ timeout: 15000 })
  })

  test('draft do formulário sobrevive à navegação', async ({ page }) => {
    const name = 'Rascunho Teste'

    await clickNovoColaborador(page)
    await page.getByLabel(/nome completo/i).fill(name)
    await page.getByRole('button', { name: /Cancelar/i }).click()
    await expect(page).toHaveURL(/\/staffs/)

    await page.getByRole('link', { name: /novo colaborador/i }).click()
    await expect(page.getByLabel(/nome completo/i)).toHaveValue(name)
  })
})

