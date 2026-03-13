import { test, expect } from '@playwright/test';
import { seedScalabilityData, cleanupScalabilityData } from './utils/scalability-seed';

test.describe('Escalabilidade de Departamentos', () => {
  let testDeptId: string;

  test.beforeAll(async () => {
    // Semeia 60 colaboradores para forçar scroll e testar performance
    const data = await seedScalabilityData(60);
    testDeptId = data.deptId;
  });

  test.afterAll(async () => {
    if (testDeptId) {
      await cleanupScalabilityData(testDeptId);
    }
  });

  test('deve lidar com 60 colaboradores na seleção sem lentidão', async ({ page }) => {
    await page.goto('/departments');
    
    // Localiza o departamento de escalabilidade na lista
    const deptRow = page.locator('tr', { hasText: 'Scalability Dept' });
    await expect(deptRow).toBeVisible({ timeout: 15000 });
    
    // Clica em Editar
    await deptRow.getByRole('button', { name: /editar/i }).click();
    
    // Passo 1: Informações do Departamento
    await expect(page.getByText('Passo 1 de 2')).toBeVisible();
    await page.getByRole('button', { name: /próximo passo/i }).click();
    
    // Passo 2: Colaboradores
    await expect(page.getByText('Passo 2 de 2')).toBeVisible();
    await expect(page.getByText(/Selecionados: 0 de/)).toBeVisible();

    // Testa a busca
    const searchField = page.getByPlaceholder(/buscar colaborador/i);
    await searchField.fill('Scalability Employee 42');
    
    // Deve exibir apenas o colaborador 42
    await expect(page.getByText('Scalability Employee 42')).toBeVisible();
    await expect(page.getByText('Scalability Employee 1')).not.toBeVisible();

    // Limpa a busca
    await searchField.fill('');
    
    // Seleciona um colaborador
    const employeeCheckbox = page.locator('div').filter({ hasText: /^Scalability Employee 1$/ }).getByRole('checkbox');
    await employeeCheckbox.click();
    
    // Verifica se o contador atualizou
    await expect(page.getByText(/Selecionados: 1 de/)).toBeVisible();

    // Valida se o container de lista é scrollável
    const listContainer = page.locator('.MuiList-root').locator('..'); // Paper que envolve a lista
    const isScrollable = await listContainer.evaluate((el) => {
      return el.scrollHeight > el.clientHeight;
    });
    expect(isScrollable).toBe(true);
  });
});
