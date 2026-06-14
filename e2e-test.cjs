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

  // 4. Check sidebar indicators count
  const indicatorCount = await page.textContent('.indicator-sidebar__heading span');
  console.log('Indicator count:', indicatorCount);

  // Check unavailable badges hidden
  const unavailableBadges = await page.locator('.indicator-list .indicator-status').filter({ hasText: 'Indisponível' }).count();
  console.log('Unavailable badges in list:', unavailableBadges);

  // 5. Check no "Valor em 0" card
  const valorEm0 = await page.locator('.metric-card__label').filter({ hasText: 'Valor em 0' }).count();
  console.log('Valor em 0 cards:', valorEm0);

  // 6. Check percent values have %
  const percentValues = await page.locator('.metric-card__value').filter({ hasText: /\d+%/ }).count();
  console.log('Percent values with %:', percentValues);

  // 7. Click an indicator and check start value
  const firstIndicator = await page.locator('.indicator-row').first();
  await firstIndicator.click();
  await page.waitForTimeout(500);
  const startValue = await page.locator('.metric-card__label:has-text("Valor em") + .metric-card__value').first().textContent();
  console.log('First indicator start value:', startValue);

  // 8. Check IDEB: navigate to Rendimento Escolar category and click IDEB
  const idedbTab = await page.locator('.category-tab').filter({ hasText: 'Rendimento Escolar' }).first();
  if (await idedbTab.count() > 0) {
    await idedbTab.click();
    await page.waitForTimeout(300);
    const idebIndicator = await page.locator('.indicator-row').filter({ hasText: 'IDEB' }).first();
    if (await idebIndicator.count() > 0) {
      await idebIndicator.click();
      await page.waitForTimeout(500);
      // Check IDEB values do NOT have %
      const idebValues = await page.locator('.metric-card__value').allTextContents();
      const hasPercentInIdeb = idebValues.some(v => v.includes('%'));
      console.log('IDEB values:', idebValues);
      console.log('IDEB has %:', hasPercentInIdeb);
      if (hasPercentInIdeb) {
        errors.push('IDEB values should not contain %');
      }
      // Check chart meta label does not have %
      const chartMetaLabel = await page.locator('.chart-meta-line__label').first().textContent().catch(() => '');
      console.log('Chart meta label:', chartMetaLabel);
      if (chartMetaLabel.includes('%')) {
        errors.push('IDEB chart meta label should not contain %');
      }
      // Check chart domain not 0-100 (should have ticks like 0,2,4,6,8,10)
      const chartTicks = await page.locator('.chart-grid text').allTextContents();
      console.log('Chart ticks:', chartTicks);
      if (chartTicks.includes('100')) {
        errors.push('IDEB chart should not have tick 100');
      }
    }
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

  // 11. Change municipality
  await page.selectOption('select[aria-label="Selecionar município"]', 'Canela');
  await waitForLoading();
  console.log('Changed to Canela');

  // 12. Mobile viewport
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

  // Check horizontal overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log('Horizontal overflow:', overflow);

  await context.close();
  await browser.close();

  console.log('\nErrors:', errors.length > 0 ? errors : 'None');

  if (errors.length > 0 || unavailableBadges > 0 || valorEm0 > 0 || overflow) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
