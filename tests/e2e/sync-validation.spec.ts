import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const PENDING_KEY = 'flugo_pending_staffs'

test('sync validation: criar colaborador não deve ficar Pendente', async ({ page }, testInfo) => {
  const consoleLogs: string[] = []
  const firestoreRequests: { method: string; url: string; status: number }[] = []

  // Captura todos os logs do console do browser
  page.on('console', msg => {
    const entry = `[${msg.type().toUpperCase()}] ${msg.text()}`
    consoleLogs.push(entry)
    if (msg.type() === 'error' || msg.text().includes('Firebase') || msg.text().includes('sync')) {
      process.stdout.write(`  browser ${entry}\n`)
    }
  })

  // Intercepta requests para o Firestore
  page.on('response', async response => {
    const url = response.url()
    if (url.includes('firestore.googleapis.com') || url.includes('firebase')) {
      const entry = { method: response.request().method(), url: url.split('?')[0], status: response.status() }
      firestoreRequests.push(entry)
      process.stdout.write(`  firebase ${entry.method} ${entry.status} ${entry.url.slice(-80)}\n`)
    }
  })

  // --- 1. Abre a página e limpa estado anterior ---
  await page.goto('/staffs', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)

  const beforeRaw = await page.evaluate((key) => localStorage.getItem(key), PENDING_KEY)
  const before: unknown[] = beforeRaw ? JSON.parse(beforeRaw) : []
  process.stdout.write(`\n  localStorage antes: ${before.length} registros pendentes\n`)

  if (before.length > 0) {
    process.stdout.write(`  Limpando ${before.length} registros presos do localStorage...\n`)
    await page.evaluate((key) => localStorage.removeItem(key), PENDING_KEY)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
  }

  // --- 2. Aguarda a página carregar ---
  await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible({ timeout: 20000 })
  await page.screenshot({ path: path.join(testInfo.outputDir, '01-lista.png') })

  // --- 3. Cria um colaborador ---
  const suffix = Date.now()
  const name = `Sync Test ${suffix}`
  const email = `sync-${suffix}@teste.com`

  await page.getByRole('button', { name: /Novo Colaborador/i }).click()
  await page.getByLabel('Nome').fill(name)
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('button', { name: /Próximo/i }).click()
  await page.getByLabel('Departamento').click()
  await page.getByRole('option', { name: 'TI' }).click()

  process.stdout.write('\n  Enviando formulário...\n')
  await page.getByRole('button', { name: /Concluir/i }).click()

  // --- 4. Captura o feedback da UI ---
  const alert = page.locator('.MuiAlert-message, [role="alert"]').first()
  await expect(alert).toBeVisible({ timeout: 20000 })
  const feedbackText = await alert.innerText()
  process.stdout.write(`  Feedback UI: "${feedbackText}"\n`)
  await page.screenshot({ path: path.join(testInfo.outputDir, '02-feedback.png') })

  const syncedOk = !feedbackText.toLowerCase().includes('local')

  // --- 5. Aguarda redirecionamento para a lista ---
  await expect(page).toHaveURL(/\/staffs/, { timeout: 15000 })
  await page.waitForTimeout(2000)

  // --- 6. Verifica localStorage depois ---
  const afterRaw = await page.evaluate((key) => localStorage.getItem(key), PENDING_KEY)
  const after: unknown[] = afterRaw ? JSON.parse(afterRaw) : []
  process.stdout.write(`  localStorage depois: ${after.length} registros pendentes\n`)

  // --- 7. Verifica chip "Pendente" na linha criada ---
  const row = page.locator('tr', { hasText: email })
  await expect(row).toBeVisible({ timeout: 10000 })

  const pendingChip = row.getByText('Pendente')
  const chipVisible = await pendingChip.isVisible().catch(() => false)
  process.stdout.write(`  Chip "Pendente" visível: ${chipVisible}\n`)
  await page.screenshot({ path: path.join(testInfo.outputDir, '03-lista-final.png') })

  // --- 8. Relatório final ---
  process.stdout.write('\n  ── RELATÓRIO ──────────────────────────────────────\n')
  process.stdout.write(`  Firebase requests:  ${firestoreRequests.length}\n`)
  firestoreRequests.forEach(r => process.stdout.write(`    ${r.method} ${r.status}  ${r.url.slice(-70)}\n`))
  process.stdout.write(`  Console errors:     ${consoleLogs.filter(l => l.startsWith('[ERROR]')).length}\n`)
  consoleLogs.filter(l => l.startsWith('[ERROR]')).forEach(l => process.stdout.write(`    ${l}\n`))
  process.stdout.write(`  Feedback synced:    ${syncedOk}\n`)
  process.stdout.write(`  Pendentes depois:   ${after.length}\n`)
  process.stdout.write(`  Chip "Pendente":    ${chipVisible}\n`)

  // Salva relatório em arquivo para evidência
  const report = {
    timestamp: new Date().toISOString(),
    email,
    feedbackText,
    syncedOk,
    pendingBefore: before.length,
    pendingAfter: after.length,
    chipVisible,
    firestoreRequests,
    consoleErrors: consoleLogs.filter(l => l.startsWith('[ERROR]')),
  }
  fs.writeFileSync(
    path.join(testInfo.outputDir, 'sync-report.json'),
    JSON.stringify(report, null, 2)
  )

  // --- 9. Assertions ---
  expect(chipVisible, `Chip "Pendente" está visível — sync falhou. Feedback: "${feedbackText}"`).toBe(false)
  expect(syncedOk, `UI reportou salvo apenas localmente: "${feedbackText}"`).toBe(true)
  expect(after.length, `Ainda há ${after.length} registros no localStorage após criação`).toBe(0)
})
