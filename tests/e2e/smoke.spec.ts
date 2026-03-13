import { test, expect } from '@playwright/test'
import { cleanupTestRecords } from './utils/cleanup'
import { ensureAuthenticated } from './utils/auth'

test.afterEach(async () => {
  await cleanupTestRecords()
})

test.describe('Smoke', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[Browser Error] ${msg.text()}`)
    })
    page.on('requestfailed', request => {
      console.log(`[Resource Error] ${request.url()} - ${request.failure()?.errorText}`)
    })
    await ensureAuthenticated(page)
  })

  test('página inicial carrega', async ({ page }) => {
    await expect(page.getByText('Colaboradores', { exact: false }).first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('a:has-text("Novo Colaborador"),button:has-text("Novo Colaborador")').first()).toBeVisible()
  })

  test('tabela de colaboradores renderiza sem erro', async ({ page }) => {
    await expect(page.getByText('Colaboradores', { exact: false }).first()).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Erro')).not.toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('formulário de cadastro renderiza', async ({ page }) => {
    await page.goto('/staffs/new', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Informações Básicas' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByLabel(/nome completo/i)).toBeVisible()
    await expect(page.getByLabel(/e-mail corporativo/i)).toBeVisible()
  })

  test('botão Cancelar no formulário retorna para a lista', async ({ page }) => {
    await page.goto('/staffs/new', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Informações Básicas' })).toBeVisible({ timeout: 20000 })
    await page.getByRole('button', { name: /Cancelar/i }).click()
    await expect(page).toHaveURL(/\/staffs/, { timeout: 10000 })
  })

  test('Firebase conecta e lista responde', async ({ page }) => {
    await page.goto('/staffs', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible({ timeout: 20000 })
    await expect(
      page.getByText(/Não conseguimos carregar/i)
    ).not.toBeVisible({ timeout: 15000 })
  })
})
