import { test, expect } from '@playwright/test'

test.describe('Listagem de colaboradores', () => {
  test('exibe tabela com as colunas corretas', async ({ page }) => {
    await page.goto('/staffs')
    await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Nome' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Departamento' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  })
})

test.describe('Cadastro de colaborador', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/staffs')
    await page.evaluate(() => localStorage.clear())
  })

  test('cria colaborador com status Ativo', async ({ page }) => {
    const suffix = Date.now()
    const name = `Teste Ativo ${suffix}`
    const email = `ativo-${suffix}@empresa.com`

    await page.getByRole('button', { name: /Novo Colaborador/i }).click()
    await page.getByLabel('Nome').fill(name)
    await page.getByLabel('E-mail').fill(email)
    await page.getByRole('button', { name: /Próximo/i }).click()
    await page.getByLabel('Departamento').click()
    await page.getByRole('option', { name: 'TI' }).click()
    await page.getByRole('button', { name: /Concluir/i }).click()

    await expect(page.getByText(/sucesso/i)).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/\/staffs/, { timeout: 10000 })
    await expect(page.getByText(name)).toBeVisible()
    await expect(page.getByText('Ativo')).toBeVisible()
  })

  test('cria colaborador com status Inativo', async ({ page }) => {
    const suffix = Date.now()
    const name = `Teste Inativo ${suffix}`
    const email = `inativo-${suffix}@empresa.com`

    await page.getByRole('button', { name: /Novo Colaborador/i }).click()
    await page.getByLabel('Nome').fill(name)
    await page.getByLabel('E-mail').fill(email)
    await page.getByRole('switch').click()
    await page.getByRole('button', { name: /Próximo/i }).click()
    await page.getByLabel('Departamento').click()
    await page.getByRole('option', { name: 'Design' }).click()
    await page.getByRole('button', { name: /Concluir/i }).click()

    await expect(page.getByText(/sucesso|local/i)).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/\/staffs/, { timeout: 10000 })
    await expect(page.getByText(name)).toBeVisible()
  })

  test('bloqueia avanço com nome menor que 3 caracteres', async ({ page }) => {
    await page.getByRole('button', { name: /Novo Colaborador/i }).click()
    await page.getByLabel('Nome').fill('AB')
    await page.getByLabel('E-mail').fill('valido@empresa.com')
    await page.getByRole('button', { name: /Próximo/i }).click()

    await expect(page.getByText(/pelo menos 3/i)).toBeVisible()
    await expect(page.getByText('Informações Básicas')).toBeVisible()
  })

  test('bloqueia avanço com e-mail inválido', async ({ page }) => {
    await page.getByRole('button', { name: /Novo Colaborador/i }).click()
    await page.getByLabel('Nome').fill('Nome Válido')
    await page.getByLabel('E-mail').fill('nao-e-email')
    await page.getByRole('button', { name: /Próximo/i }).click()

    await expect(page.getByText(/inválido/i)).toBeVisible()
    await expect(page.getByText('Informações Básicas')).toBeVisible()
  })

  test('Voltar no passo 2 preserva campos do passo 1', async ({ page }) => {
    const name = 'Nome Preservado'
    const email = `preservado-${Date.now()}@empresa.com`

    await page.getByRole('button', { name: /Novo Colaborador/i }).click()
    await page.getByLabel('Nome').fill(name)
    await page.getByLabel('E-mail').fill(email)
    await page.getByRole('button', { name: /Próximo/i }).click()
    await expect(page.getByText('Informações Profissionais')).toBeVisible()
    await page.getByRole('button', { name: /Voltar/i }).click()

    await expect(page.getByLabel('Nome')).toHaveValue(name)
    await expect(page.getByLabel('E-mail')).toHaveValue(email)
  })

  test('rejeita e-mail já cadastrado localmente', async ({ page }) => {
    const suffix = Date.now()
    const email = `dup-${suffix}@empresa.com`

    await page.getByRole('button', { name: /Novo Colaborador/i }).click()
    await page.getByLabel('Nome').fill(`Primeiro ${suffix}`)
    await page.getByLabel('E-mail').fill(email)
    await page.getByRole('button', { name: /Próximo/i }).click()
    await page.getByLabel('Departamento').click()
    await page.getByRole('option', { name: 'RH' }).click()
    await page.getByRole('button', { name: /Concluir/i }).click()
    await expect(page.getByText(/sucesso|local/i)).toBeVisible({ timeout: 15000 })

    await page.goto('/staffs/new')
    await page.getByLabel('Nome').fill(`Segundo ${suffix}`)
    await page.getByLabel('E-mail').fill(email)
    await page.getByRole('button', { name: /Próximo/i }).click()
    await page.getByLabel('Departamento').click()
    await page.getByRole('option', { name: 'Marketing' }).click()
    await page.getByRole('button', { name: /Concluir/i }).click()

    await expect(page.getByText(/já existe/i)).toBeVisible({ timeout: 15000 })
  })

  test('draft do formulário sobrevive à navegação', async ({ page }) => {
    const name = 'Rascunho Teste'

    await page.getByRole('button', { name: /Novo Colaborador/i }).click()
    await page.getByLabel('Nome').fill(name)
    await page.getByRole('button', { name: /Voltar/i }).click()
    await expect(page).toHaveURL(/\/staffs/)

    await page.getByRole('button', { name: /Novo Colaborador/i }).click()
    await expect(page.getByLabel('Nome')).toHaveValue(name)
  })
})

