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

  // 4. Check percentual indicators
  const atendimentoTab = await page.locator('.category-tab').filter({ hasText: 'Atendimento Escolar' }).first();
  if (await atendimentoTab.count() > 0) {
    await atendimentoTab.click();
    await page.waitForTimeout(300);
    // Click on Creche indicator (percentual)
    const crecheIndicator = await page.locator('.indicator-row').filter({ hasText: 'População de 0 a 3 anos' }).first();
    if (await crecheIndicator.count() > 0) {
      await crecheIndicator.click();
      await page.waitForTimeout(500);
      const values = await page.locator('.metric-card__value').allTextContents();
      console.log('Creche values:', values);
      const hasPercent = values.some(v => v.includes('%'));
      console.log('Creche has %:', hasPercent);
      if (!hasPercent) {
        errors.push('Creche (percentual) should have %');
      }
      const chartLabels = await page.locator('.chart-data-labels text').allTextContents();
      console.log('Chart data labels:', chartLabels);
      const chartLabelsHavePercent = chartLabels.every(l => l.includes('%') || l === '-');
      console.log('Chart labels have %:', chartLabelsHavePercent);
    }
  }

  // 5. Check absolute indicator
  const medioTecnicoIndicator = await page.locator('.indicator-row').filter({ hasText: 'Número absoluto de matrículas' }).first();
  if (await medioTecnicoIndicator.count() > 0) {
    await medioTecnicoIndicator.click();
    await page.waitForTimeout(500);
    const values = await page.locator('.metric-card__value').allTextContents();
    console.log('Medio Tecnico values:', values);
    const hasPercent = values.some(v => v.includes('%'));
    console.log('Medio Tecnico has %:', hasPercent);
    if (hasPercent) {
      errors.push('Medio Tecnico (absolute) should NOT have %');
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
      console.log('IDEB has %:', hasPercent);
      if (hasPercent) {
        errors.push('IDEB should NOT have %');
      }
      const chartTicks = await page.locator('.chart-grid text').allTextContents();
      console.log('IDEB chart ticks:', chartTicks);
      if (chartTicks.includes('100')) {
        errors.push('IDEB chart should not have tick 100');
      }
      const chartLabels = await page.locator('.chart-data-labels text').allTextContents();
      console.log('IDEB chart data labels:', chartLabels);
    }
  }

  // 7. Check unavailable badges hidden
  const unavailableBadges = await page.locator('.indicator-list .indicator-status').filter({ hasText: 'Indisponível' }).count();
  console.log('Unavailable badges in list:', unavailableBadges);
  if (unavailableBadges > 0) {
    errors.push('Unavailable badges should be hidden');
  }

  // 8. Check "Valor em 0" card
  const valorEm0 = await page.locator('.metric-card__label').filter({ hasText: 'Valor em 0' }).count();
  console.log('Valor em 0 cards:', valorEm0);
  if (valorEm0 > 0) {
    errors.push('Found Valor em 0 card');
  }

  // 9. Navigate to PNE 2026-2036
  await page.click('button:has-text("PNE 2026-2036")');
  await waitForLoading();
  await page.waitForSelector('.cycle-page', { timeout: 10000 });
  console.log('PNE 2026-2036 page loaded');

  // 10. Navigate to Diagnóstico
  await page.click('button:has-text("Diagnóstico")');
  await waitForLoading();
  await page.waitForSelector('.diagnostic-panel', { timeout: 10000 });
  console.log('Diagnóstico page loaded');

  // 11. Mobile viewport
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
  console.log('Horizontal overflow:', overflow);
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
