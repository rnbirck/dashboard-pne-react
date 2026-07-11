const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { PNG } = require('../../node_modules/playwright-core/lib/utilsBundle.js');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const UPDATE = process.env.UPDATE_VISUAL_BASELINES === '1';
const MAX_DIFFERENT_PIXEL_RATIO = 0.002;
const CHANNEL_TOLERANCE = 20;
const VIEWPORTS = [[1366, 768], [1280, 720], [1024, 768]];
const BASELINE_DIR = path.resolve(__dirname, 'visual-baselines');
const DIFF_DIR = path.resolve(__dirname, 'visual-diffs');

const CASES = [
  { key: 'home', open: async (page) => page.locator('.home-page').waitFor(), region: '.home-page' },
  { key: 'pne-2014', navigation: 'PNE 2014–2024', region: '.cycle-page' },
  { key: 'pne-2026', navigation: 'PNE 2026–2036', region: '.cycle-page' },
  { key: 'educacao', navigation: 'Indicadores de Educação', region: '.educacao-page' },
  { key: 'diagnostico', navigation: 'Diagnóstico municipal', region: '.diagnostic-panel' },
  { key: 'fundeb', navigation: 'Indicadores Financeiros da Educação', tab: /^FUNDEB/, region: '.fundeb-panel-embedded' },
  { key: 'siope', navigation: 'Indicadores Financeiros da Educação', tab: /Aplicação dos Recursos/, region: '.siope-panel' },
];

async function selectMunicipality(page) {
  const input = page.locator('.context-bar .municipio-selector__input');
  await input.fill('Áurea');
  await page.getByRole('option', { name: 'Áurea', exact: true }).click();
}

function comparePng(actualBuffer, expectedBuffer) {
  const actual = PNG.sync.read(actualBuffer);
  const expected = PNG.sync.read(expectedBuffer);
  assert.equal(actual.width, expected.width, 'largura da região mudou');
  assert.equal(actual.height, expected.height, 'altura da região mudou');
  const diff = new PNG({ width: actual.width, height: actual.height });
  let differentPixels = 0;
  for (let index = 0; index < actual.data.length; index += 4) {
    const different = [0, 1, 2, 3].some((channel) => (
      Math.abs(actual.data[index + channel] - expected.data[index + channel]) > CHANNEL_TOLERANCE
    ));
    if (different) differentPixels += 1;
    diff.data[index] = different ? 220 : actual.data[index] * 0.25;
    diff.data[index + 1] = different ? 38 : actual.data[index + 1] * 0.25;
    diff.data[index + 2] = different ? 38 : actual.data[index + 2] * 0.25;
    diff.data[index + 3] = 255;
  }
  return { diff: PNG.sync.write(diff), ratio: differentPixels / (actual.width * actual.height) };
}

async function prepareCase(page, testCase) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await selectMunicipality(page);
  if (testCase.navigation) {
    await page.getByRole('button', { name: testCase.navigation, exact: true }).click();
  }
  if (testCase.tab) {
    const tablist = page.getByRole('tablist', { name: 'Módulos de financiamento da educação' });
    await tablist.getByRole('tab', { name: testCase.tab }).click();
  }
  await testCase.open?.(page);
  const region = page.locator(testCase.region).first();
  await region.waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  return region;
}

async function run() {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
  fs.rmSync(DIFF_DIR, { recursive: true, force: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [width, height] of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      for (const testCase of CASES) {
        const region = await prepareCase(page, testCase);
        const name = `${testCase.key}-${width}x${height}.png`;
        const baselinePath = path.join(BASELINE_DIR, name);
        const actual = await region.screenshot({ animations: 'disabled' });
        if (UPDATE) {
          fs.writeFileSync(baselinePath, actual);
          continue;
        }
        assert.ok(fs.existsSync(baselinePath), `baseline ausente: ${name}; execute npm run update:visual`);
        const comparison = comparePng(actual, fs.readFileSync(baselinePath));
        if (comparison.ratio > MAX_DIFFERENT_PIXEL_RATIO) {
          fs.mkdirSync(DIFF_DIR, { recursive: true });
          fs.writeFileSync(path.join(DIFF_DIR, name), comparison.diff);
        }
        assert.ok(
          comparison.ratio <= MAX_DIFFERENT_PIXEL_RATIO,
          `${name}: ${(comparison.ratio * 100).toFixed(3)}% dos pixels diferem (limite ${(MAX_DIFFERENT_PIXEL_RATIO * 100).toFixed(1)}%)`,
        );
      }
      await page.close();
    }

    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const mobileCase = CASES.find((testCase) => testCase.key === 'pne-2026');
    const mobileRegion = await prepareCase(mobilePage, mobileCase);
    const mobileName = 'pne-2026-390x844.png';
    const mobileBaselinePath = path.join(BASELINE_DIR, mobileName);
    const mobileActual = await mobileRegion.screenshot({ animations: 'disabled' });
    if (UPDATE) {
      fs.writeFileSync(mobileBaselinePath, mobileActual);
    } else {
      assert.ok(fs.existsSync(mobileBaselinePath), `baseline ausente: ${mobileName}; execute npm run update:visual`);
      const comparison = comparePng(mobileActual, fs.readFileSync(mobileBaselinePath));
      if (comparison.ratio > MAX_DIFFERENT_PIXEL_RATIO) {
        fs.mkdirSync(DIFF_DIR, { recursive: true });
        fs.writeFileSync(path.join(DIFF_DIR, mobileName), comparison.diff);
      }
      assert.ok(comparison.ratio <= MAX_DIFFERENT_PIXEL_RATIO, `${mobileName}: diferença visual acima de 0,2%`);
    }
    await mobilePage.close();
  } finally {
    await browser.close();
  }
  console.log(`Visual baseline passed: ${CASES.length * VIEWPORTS.length + 1} regiões; tolerância de ${(MAX_DIFFERENT_PIXEL_RATIO * 100).toFixed(1)}%.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
