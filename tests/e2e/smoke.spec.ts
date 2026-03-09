import { test, expect } from '@playwright/test'

test.describe('Smoke', () => {
  test('página inicial carrega', async ({ page }) => {
    await page.goto('/staffs', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible({ timeout: 20000 })
  })

  test('tabela de colaboradores renderiza sem erro', async ({ page }) => {
    await page.goto('/staffs', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Erro')).not.toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('formulário de cadastro renderiza', async ({ page }) => {
    await page.goto('/staffs/new', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Informações Básicas')).toBeVisible({ timeout: 20000 })
    await expect(page.getByLabel('Nome')).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
  })

  test('botão Voltar no formulário retorna para a lista', async ({ page }) => {
    await page.goto('/staffs/new', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Informações Básicas')).toBeVisible({ timeout: 20000 })
    await page.getByRole('button', { name: /Voltar/i }).click()
    await expect(page).toHaveURL(/\/staffs/, { timeout: 10000 })
  })

  test('Firebase conecta e lista responde', async ({ page }) => {
    await page.goto('/staffs', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible({ timeout: 20000 })
    await expect(
      page.getByText('Não foi possível carregar os colaboradores')
    ).not.toBeVisible({ timeout: 15000 })
  })
})
