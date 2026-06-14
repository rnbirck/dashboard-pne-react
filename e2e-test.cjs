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

  // Check no comparison text
  const bodyText = await page.textContent('body');
  const forbiddenWords = ['compare', 'comparar', 'comparação', 'comparando', 'comparado'];
  const hasForbidden = forbiddenWords.some(w => bodyText.toLowerCase().includes(w));
  console.log('Has forbidden comparison words:', hasForbidden);
  if (hasForbidden) {
    errors.push('Home page contains comparison words');
  }

  // 2. Select municipality (Áurea)
  await page.selectOption('select[aria-label="Selecionar município"]', 'Áurea');
  await waitForLoading();
  await page.waitForSelector('.selection-alert.is-selected', { timeout: 10000 });
  console.log('Municipio Áurea selected');

  // 3. Navigate to PNE 2014-2024
  await page.click('button:has-text("PNE 2014-2024")');
  await waitForLoading();
  await page.waitForTimeout(1000);
  await page.waitForSelector('.cycle-page', { timeout: 10000 });
  console.log('PNE 2014-2024 page loaded');

  // 4. Check IDEB
  const idedbTab = await page.locator('.category-tab').filter({ hasText: 'Rendimento Escolar' }).first();
  if (await idedbTab.count() > 0) {
    await idedbTab.click();
    await page.waitForTimeout(300);
    const idebIndicator = await page.locator('.indicator-row').filter({ hasText: 'IDEB' }).first();
    if (await idebIndicator.count() > 0) {
      await idebIndicator.click();
      await page.waitForTimeout(500);
      const idebValues = await page.locator('.metric-card__value').allTextContents();
      const hasPercentInIdeb = idebValues.some(v => v.includes('%'));
      console.log('IDEB values:', idebValues);
      console.log('IDEB has %:', hasPercentInIdeb);
      if (hasPercentInIdeb) {
        errors.push('IDEB values should not contain %');
      }
      const chartMetaLabel = await page.locator('.chart-meta-line__label').first().textContent().catch(() => '');
      console.log('Chart meta label:', chartMetaLabel);
      if (chartMetaLabel.includes('%')) {
        errors.push('IDEB chart meta label should not contain %');
      }
      const dataLabels = await page.locator('.chart-data-labels text').allTextContents();
      console.log('Chart data labels:', dataLabels);
      if (dataLabels.length === 0) {
        errors.push('Chart should have data labels');
      }
      const chartTicks = await page.locator('.chart-grid text').allTextContents();
      console.log('Chart ticks:', chartTicks);
      if (chartTicks.includes('100')) {
        errors.push('IDEB chart should not have tick 100');
      }
    }
  }

  // 5. Check single year indicator
  const atendimentoTab = await page.locator('.category-tab').filter({ hasText: 'Atendimento Escolar' }).first();
  if (await atendimentoTab.count() > 0) {
    await atendimentoTab.click();
    await page.waitForTimeout(300);
    const valorEm0 = await page.locator('.metric-card__label').filter({ hasText: 'Valor em 0' }).count();
    console.log('Valor em 0 cards:', valorEm0);
    if (valorEm0 > 0) {
      errors.push('Found Valor em 0 card');
    }
  }

  // 6. Check unavailable badges hidden
  const unavailableBadges = await page.locator('.indicator-list .indicator-status').filter({ hasText: 'Indisponível' }).count();
  console.log('Unavailable badges in list:', unavailableBadges);
  if (unavailableBadges > 0) {
    errors.push('Unavailable badges should be hidden');
  }

  // 7. Navigate to PNE 2026-2036
  await page.click('button:has-text("PNE 2026-2036")');
  await waitForLoading();
  await page.waitForSelector('.cycle-page', { timeout: 10000 });
  console.log('PNE 2026-2036 page loaded');

  // 8. Navigate to Diagnóstico
  await page.click('button:has-text("Diagnóstico")');
  await waitForLoading();
  await page.waitForSelector('.diagnostic-panel', { timeout: 10000 });
  console.log('Diagnóstico page loaded');

  // 9. Mobile viewport
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
