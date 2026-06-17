const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';

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

  async function selectMunicipio(nome) {
    const input = page.locator('.municipio-selector__input').first();
    await input.click();
    await input.fill(nome);
    await page.locator('.municipio-selector__option').filter({ hasText: nome }).first().click();
  }

  await page.goto(BASE_URL);
  await waitForLoading();
  await page.waitForSelector('.home-hero', { timeout: 10000 });
  await selectMunicipio('Áurea');
  await waitForLoading();
  await page.click('button:has-text("PNE 2014-2024")');
  await waitForLoading();
  await page.waitForSelector('.cycle-page', { timeout: 10000 });

  // 1. Test Creche (percentual, 11 pontos)
  const crecheIndicator = await page.locator('.indicator-row').filter({ hasText: 'População de 0 a 3 anos' }).first();
  await crecheIndicator.click();
  await page.waitForTimeout(500);
  const dataLabels = await page.locator('.chart-data-labels text').allTextContents();
  console.log('Creche data labels:', dataLabels);
  const metaLabel = dataLabels.find((l) => l.startsWith('Meta'));
  console.log('Creche meta label:', metaLabel);
  if (!metaLabel) {
    errors.push('Creche should have meta label');
  }

  // 2. Check overlaps
  const crechePositions = await page.evaluate(() => {
    const labels = document.querySelectorAll('.chart-data-labels text');
    return Array.from(labels).map((el) => ({
      text: el.textContent,
      x: parseFloat(el.getAttribute('x')),
      y: parseFloat(el.getAttribute('y')),
      classes: el.getAttribute('class'),
    }));
  });
  console.log('Creche label positions:', crechePositions);

  // Check overlaps
  let overlapCount = 0;
  for (let i = 0; i < crechePositions.length; i++) {
    for (let j = i + 1; j < crechePositions.length; j++) {
      const a = crechePositions[i];
      const b = crechePositions[j];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      if (dx < 30 && dy < 18) {
        console.log(`OVERLAP: "${a.text}" and "${b.text}" at (${a.x},${a.y}) vs (${b.x},${b.y})`);
        overlapCount++;
      }
    }
  }
  if (overlapCount > 0) {
    errors.push(`Found ${overlapCount} label overlaps in Creche chart`);
  }

  // 3. Test IDEB (short series, 3 points)
  const idedbTab = await page.locator('.category-tab').filter({ hasText: 'Rendimento Escolar' }).first();
  await idedbTab.click();
  await page.waitForTimeout(300);
  const idebIndicator = await page.locator('.indicator-row').filter({ hasText: 'IDEB' }).first();
  await idebIndicator.click();
  await page.waitForTimeout(500);
  const idebLabels = await page.locator('.chart-data-labels text').allTextContents();
  console.log('IDEB data labels:', idebLabels);
  const idebMeta = idebLabels.find((l) => l.startsWith('Meta'));
  console.log('IDEB meta label:', idebMeta);
  if (!idebMeta) {
    errors.push('IDEB should have meta label');
  }
  const idebPositions = await page.evaluate(() => {
    const labels = document.querySelectorAll('.chart-data-labels text');
    return Array.from(labels).map((el) => ({
      text: el.textContent,
      x: parseFloat(el.getAttribute('x')),
      y: parseFloat(el.getAttribute('y')),
      classes: el.getAttribute('class'),
    }));
  });
  console.log('IDEB label positions:', idebPositions);
  for (let i = 0; i < idebPositions.length; i++) {
    for (let j = i + 1; j < idebPositions.length; j++) {
      const a = idebPositions[i];
      const b = idebPositions[j];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      if (dx < 30 && dy < 18) {
        console.log(`IDEB OVERLAP: "${a.text}" and "${b.text}" at (${a.x},${a.y}) vs (${b.x},${b.y})`);
      }
    }
  }

  // 4. PNE 2026-2036
  await page.click('button:has-text("PNE 2026-2036")');
  await waitForLoading();
  await page.waitForSelector('.cycle-page', { timeout: 10000 });
  // Click on Atendimento Escolar tab first
  const atendimento2026 = await page.locator('.category-tab').filter({ hasText: 'Atendimento Escolar' }).first();
  if (await atendimento2026.count() > 0) {
    await atendimento2026.click();
    await page.waitForTimeout(300);
  }
  const creche2026 = await page.locator('.indicator-row').filter({ hasText: 'População de 0 a 3 anos' }).first();
  if (await creche2026.count() > 0) {
    await creche2026.click();
    await page.waitForTimeout(500);
    const creche2026Labels = await page.locator('.chart-data-labels text').allTextContents();
    console.log('Creche 2026 labels:', creche2026Labels);
  } else {
    console.log('Creche 2026 not found, skipping');
  }

  // 5. Mobile
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto(BASE_URL);
  await waitForLoading();
  await page.waitForSelector('.home-hero', { timeout: 10000 });
  await selectMunicipio('Áurea');
  await waitForLoading();
  await page.click('button:has-text("PNE 2014-2024")');
  await waitForLoading();
  await page.waitForSelector('.cycle-page', { timeout: 10000 });
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
