import { test, expect } from '@playwright/test'

const PROD_URL = 'https://flugo-employees-theta.vercel.app/staffs/new'

test('Forjar cadastro em produção e capturar erros reais', async ({ page }) => {
  console.log(`Testando salvamento em: ${PROD_URL}`)
  
  // Monitora logs do navegador
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Firebase')) {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    }
  })

  await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })

  // 1. Preenche o formulário (Passo 1)
  await page.getByLabel('Nome').fill('Forced Test User')
  await page.getByLabel('E-mail').fill(`force-${Date.now()}@test.com`)
  await page.getByRole('button', { name: /Próximo/i }).click()

  // Aguarda a transição para o Passo 2
  await expect(page.getByText('Informações Profissionais')).toBeVisible({ timeout: 10000 })

  // 2. Preenche o formulário (Passo 2)
  const deptSelect = page.getByLabel('Departamento')
  await expect(deptSelect).toBeVisible({ timeout: 10000 })
  await deptSelect.click()
  await page.getByRole('option', { name: 'TI', exact: true }).click()

  // 3. Tenta salvar
  console.log('Enviando formulário...')
  await page.getByRole('button', { name: /Concluir/i }).click()

  // 4. Aguarda o feedback de erro ou sucesso
  const alert = page.locator('.MuiAlert-message')
  await expect(alert).toBeVisible({ timeout: 20000 })
  
  const finalMessage = await alert.innerText()
  console.log(`RESULTADO NA TELA: ${finalMessage}`)

  if (finalMessage.includes('sucesso')) {
    console.log('PROVA TÉCNICA: Sincronização funcionou com sucesso!')
  } else {
    console.error('PROVA TÉCNICA: Firebase falhou em produção. Mensagem:', finalMessage)
  }
})
