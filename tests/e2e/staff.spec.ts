import { test, expect } from '@playwright/test'

test.describe('Fluxo de Colaboradores', () => {
  test.beforeEach(async ({ page }) => {
    // Limpa o localStorage e vai para a home
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('deve permitir cadastrar um novo colaborador', async ({ page }) => {
    const randomSuffix = Math.floor(Math.random() * 10000)
    const email = `test-${randomSuffix}@empresa.com`
    const name = `Colaborador Teste ${randomSuffix}`

    await page.goto('/')
    
    // Espera o título da página ou o botão
    await expect(page.getByText('Colaboradores')).toBeVisible({ timeout: 15000 })
    
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
    await expect(page.getByText(/sucesso/i)).toBeVisible({ timeout: 15000 })
    
    // Verifica se voltou para a lista
    await expect(page).toHaveURL(/\/staffs/, { timeout: 10000 })
    await expect(page.getByText(name)).toBeVisible()
  })

  test('deve validar e-mail duplicado no primeiro passo', async ({ page }) => {
    const email = `dup-${Math.floor(Math.random() * 10000)}@teste.com`
    
    // Primeiro cadastro
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('button:has-text("Novo Colaborador")')
    await page.click('button:has-text("Novo Colaborador")')
    await page.fill('input[name="name"]', 'Primeiro')
    await page.fill('input[name="email"]', email)
    await page.click('button:has-text("Próximo")')
    await page.click('label:has-text("Departamento") + div')
    await page.click('li[data-value="RH"]')
    await page.click('button:has-text("Concluir")')
    await expect(page.getByText(/sucesso/i)).toBeVisible({ timeout: 15000 })

    // Tenta cadastrar de novo com o mesmo e-mail
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('button:has-text("Novo Colaborador")')
    await page.click('button:has-text("Novo Colaborador")')
    await page.fill('input[name="name"]', 'Segundo')
    await page.fill('input[name="email"]', email)
    await page.click('button:has-text("Próximo")')
    await page.click('label:has-text("Departamento") + div')
    await page.click('li[data-value="Marketing"]')
    await page.click('button:has-text("Concluir")')

    // Verifica se a mensagem de erro aparece
    await expect(page.getByText(/Já existe/i)).toBeVisible({ timeout: 15000 })
  })
})
