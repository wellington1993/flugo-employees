import { test, expect } from '@playwright/test'

const PROD_URL_GHP = 'https://wellington1993.github.io/flugo-employees/'
const PROD_URL_VERCEL = 'https://flugo-employees-theta.vercel.app/'

test.describe('Produção - Validação Real (GHP)', () => {
  test('deve criar um colaborador real no GitHub Pages', async ({ page }) => {
    const randomSuffix = Math.floor(Math.random() * 1000000)
    const email = `smoke-${randomSuffix}@wellington.com`
    const name = `PROD TEST ${randomSuffix}`

    await page.goto(PROD_URL_GHP, { waitUntil: 'domcontentloaded', timeout: 60000 })
    
    // Espera o título da página (heading) para evitar ambiguidade com o menu
    await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible({ timeout: 20000 })
    
    // Clica no botão de adicionar
    await page.getByRole('button', { name: /Novo Colaborador/i }).click()

    // PASSO 1: Infos Básicas
    await page.getByLabel('Nome').fill(name)
    await page.getByLabel('E-mail').fill(email)
    await page.getByRole('button', { name: /Próximo/i }).click()

    // PASSO 2: Infos Profissionais
    await page.getByLabel('Departamento').click()
    await page.getByRole('option', { name: 'TI' }).click()

    // FINALIZAR
    await page.getByRole('button', { name: /Concluir/i }).click()

    // Espera a notificação de sucesso
    await expect(page.getByText(/sucesso/i)).toBeVisible({ timeout: 20000 })
    
    // Verifica se voltou para a lista
    await expect(page).toHaveURL(/\/staffs/, { timeout: 15000 })
    await expect(page.getByText(name)).toBeVisible()
  })
})

test.describe('Produção - Validação Real (Vercel)', () => {
  test('deve carregar a aplicação na Vercel', async ({ page }) => {
    await page.goto(PROD_URL_VERCEL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible({ timeout: 20000 })
  })
})
