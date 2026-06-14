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

  async function waitForLoading() {
    await page.waitForSelector('.state-box--loading', { state: 'detached', timeout: 30000 }).catch(() => {});
  }

  await page.goto(BASE_URL);
  await waitForLoading();
  await page.waitForSelector('.home-hero', { timeout: 10000 });
  await page.selectOption('select[aria-label="Selecionar município"]', 'Áurea');
  await waitForLoading();
  await page.click('button:has-text("PNE 2014-2024")');
  await waitForLoading();
  await page.waitForSelector('.cycle-page', { timeout: 10000 });

  // Check if Medio Tecnico is hidden
  const medioTecnicoRow = await page.locator('.indicator-row').filter({ hasText: 'Número absoluto de matrículas' }).count();
  console.log('Medio Tecnico (absolute) indicator visible:', medioTecnicoRow);

  // Check total indicators
  const allIndicators = await page.locator('.indicator-row').allTextContents();
  console.log('All indicators:', allIndicators);

  await context.close();
  await browser.close();
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
