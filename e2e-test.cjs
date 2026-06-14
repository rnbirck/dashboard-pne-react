const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  async function waitForLoading() {
    await page.waitForSelector('.state-box--loading', { state: 'detached', timeout: 30000 }).catch(() => {});
  }

  // 1. Home page
  await page.goto(BASE_URL);
  await waitForLoading();
  await page.waitForSelector('.home-hero', { timeout: 10000 });
  console.log('Home page loaded');

  // 2. Select municipality (Áurea)
  await page.selectOption('select[aria-label="Selecionar município"]', 'Áurea');
  await waitForLoading();
  await page.waitForSelector('.selection-alert.is-selected', { timeout: 10000 });
  console.log('Municipio Áurea selected');

  // 3. Navigate to PNE 2014-2024
  await page.click('button:has-text("PNE 2014-2024")');
  await waitForLoading();
  await page.waitForSelector('.cycle-page', { timeout: 10000 });
  console.log('PNE 2014-2024 page loaded');

  // 4. Check percentual indicator (Adequacao_ai)
  const rendimentoTab = await page.locator('.category-tab').filter({ hasText: 'Corpo Docente' }).first();
  if (await rendimentoTab.count() > 0) {
    await rendimentoTab.click();
    await page.waitForTimeout(300);
    const indicador = await page.locator('.indicator-row').filter({ hasText: 'Docentes com formação adequada nos anos iniciais' }).first();
    if (await indicador.count() > 0) {
      await indicador.click();
      await page.waitForTimeout(500);
      const values = await page.locator('.metric-card__value').allTextContents();
      console.log('Docentes formacao anos iniciais values:', values);
      const hasPercent = values.some(v => v.includes('%'));
      console.log('Has %:', hasPercent);
      if (!hasPercent) {
        errors.push('Docentes formacao (percentual) should have %');
      }
    }
  }

  // 5. Check absoluto indicator (medio_tecnico_total hidden, so test eja count if visible)
  // medio_tecnico is count, but it's hidden. Let me check Atendimento Escolar
  const atendimentoTab = await page.locator('.category-tab').filter({ hasText: 'Atendimento Escolar' }).first();
  if (await atendimentoTab.count() > 0) {
    await atendimentoTab.click();
    await page.waitForTimeout(300);
    const crecheIndicator = await page.locator('.indicator-row').filter({ hasText: 'População de 0 a 3 anos' }).first();
    if (await crecheIndicator.count() > 0) {
      await crecheIndicator.click();
      await page.waitForTimeout(500);
      const values = await page.locator('.metric-card__value').allTextContents();
      console.log('Creche values:', values);
      const hasPercent = values.some(v => v.includes('%'));
      if (!hasPercent) {
        errors.push('Creche (percentual) should have %');
      }
    }
  }

  // 6. Check IDEB
  const idedbTab = await page.locator('.category-tab').filter({ hasText: 'Rendimento Escolar' }).first();
  if (await idedbTab.count() > 0) {
    await idedbTab.click();
    await page.waitForTimeout(300);
    const idebIndicator = await page.locator('.indicator-row').filter({ hasText: 'IDEB' }).first();
    if (await idebIndicator.count() > 0) {
      await idebIndicator.click();
      await page.waitForTimeout(500);
      const values = await page.locator('.metric-card__value').allTextContents();
      console.log('IDEB values:', values);
      const hasPercent = values.some(v => v.includes('%'));
      if (hasPercent) {
        errors.push('IDEB should NOT have %');
      }
    }
  }

  // 7. Check years indicator
  const escTab = await page.locator('.category-tab').filter({ hasText: 'Escolaridade da População' }).first();
  if (await escTab.count() > 0) {
    await escTab.click();
    await page.waitForTimeout(300);
    const escolaridadeIndicator = await page.locator('.indicator-row').filter({ hasText: 'Escolaridade média' }).first();
    if (await escolaridadeIndicator.count() > 0) {
      await escolaridadeIndicator.click();
      await page.waitForTimeout(500);
      const values = await page.locator('.metric-card__value').allTextContents();
      console.log('Escolaridade media values:', values);
      const hasPercent = values.some(v => v.includes('%'));
      if (hasPercent) {
        errors.push('Escolaridade (years) should NOT have %');
      }
    }
  }

  // 8. Navigate to PNE 2026-2036
  await page.click('button:has-text("PNE 2026-2036")');
  await waitForLoading();
  await page.waitForSelector('.cycle-page', { timeout: 10000 });
  console.log('PNE 2026-2036 page loaded');

  // 9. Check Infraestrutura indicators
  const infraTab = await page.locator('.category-tab').filter({ hasText: 'Infraestrutura Escolar' }).first();
  if (await infraTab.count() > 0) {
    await infraTab.click();
    await page.waitForTimeout(300);
    const internetIndicator = await page.locator('.indicator-row').filter({ hasText: 'internet' }).first();
    if (await internetIndicator.count() > 0) {
      await internetIndicator.click();
      await page.waitForTimeout(500);
      const values = await page.locator('.metric-card__value').allTextContents();
      console.log('Internet values:', values);
      const hasPercent = values.some(v => v.includes('%'));
      if (!hasPercent) {
        errors.push('Internet (percentual) should have %');
      }
    }
  }

  // 10. Diagnostico
  await page.click('button:has-text("Diagnóstico")');
  await waitForLoading();
  await page.waitForSelector('.diagnostic-panel', { timeout: 10000 });
  console.log('Diagnóstico page loaded');

  // 11. Mobile
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto(BASE_URL);
  await waitForLoading();
  await page.waitForSelector('.home-hero', { timeout: 10000 });
  console.log('Mobile home page loaded');

  await page.selectOption('select[aria-label="Selecionar município"]', 'Áurea');
  await waitForLoading();
  await page.click('button:has-text("PNE 2014-2024")');
  await waitForLoading();
  await page.waitForSelector('.cycle-page', { timeout: 10000 });
  console.log('Mobile PNE 2014-2024 loaded');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) {
    errors.push('Horizontal overflow detected');
  }

  await context.close();
  await browser.close();

  console.log('\nErrors:', errors.length > 0 ? errors : 'None');
  if (errors.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
