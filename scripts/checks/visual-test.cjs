const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { PNG } = require('../../node_modules/playwright-core/lib/utilsBundle.js');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const UPDATE = process.env.UPDATE_VISUAL_BASELINES === '1';
const VISUAL_CASE = process.env.VISUAL_CASE?.trim() ?? '';
const MAX_DIFFERENT_PIXEL_RATIO = 0.002;
const CHANNEL_TOLERANCE = 20;
const VIEWPORTS = [[1366, 768], [1280, 720], [1024, 768]];
const BASELINE_DIR = path.resolve(__dirname, 'visual-baselines');
const DIFF_DIR = path.resolve(__dirname, 'visual-diffs');
const NEUTRAL_PIXEL = [247, 245, 239, 255];

const CASES = [
  { key: 'home', open: async (page) => page.locator('.home-page').waitFor(), region: '.home-page' },
  { key: 'pne-2014', navigationHref: '#pne2014', navigationGroup: 'pne', region: '.cycle-page' },
  { key: 'pne-2026', navigationHref: '#pne2026', navigationGroup: 'pne', region: '.cycle-page' },
  { key: 'educacao', navigationHref: '#educacao?secao=visao-geral', navigationGroup: 'educacao', region: '.educacao-page' },
  { key: 'diagnostico', navigationHref: '#diagnostico', navigationGroup: 'pne', region: '.diagnostic-panel' },
  { key: 'fundeb', navigationHref: '#financeiros-fundeb', navigationGroup: 'financeiros', region: '.fundeb-panel-embedded' },
  { key: 'siope', navigationHref: '#financeiros-aplicacao-recursos', navigationGroup: 'financeiros', region: '.siope-panel' },
];

function getGitRevision() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: path.resolve(__dirname, '../..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'indisponivel';
  }
}

function shouldRun(name) {
  if (!VISUAL_CASE) return true;
  const stem = name.replace(/\.png$/, '');
  return VISUAL_CASE === name || VISUAL_CASE === stem;
}

function fill(png, pixel) {
  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = pixel[0];
    png.data[index + 1] = pixel[1];
    png.data[index + 2] = pixel[2];
    png.data[index + 3] = pixel[3];
  }
}

function copyToCanvas(source, target) {
  const rowLength = source.width * 4;
  for (let row = 0; row < source.height; row += 1) {
    source.data.copy(target.data, row * target.width * 4, row * rowLength, (row + 1) * rowLength);
  }
}

function comparePng(actualBuffer, expectedBuffer) {
  const actual = PNG.sync.read(actualBuffer);
  const expected = PNG.sync.read(expectedBuffer);
  const width = Math.max(actual.width, expected.width);
  const height = Math.max(actual.height, expected.height);
  const actualCanvas = new PNG({ width, height });
  const expectedCanvas = new PNG({ width, height });
  const diff = new PNG({ width, height });
  fill(actualCanvas, NEUTRAL_PIXEL);
  fill(expectedCanvas, NEUTRAL_PIXEL);
  copyToCanvas(actual, actualCanvas);
  copyToCanvas(expected, expectedCanvas);

  let differentPixels = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const inActual = x < actual.width && y < actual.height;
      const inExpected = x < expected.width && y < expected.height;
      const different = !inActual || !inExpected || [0, 1, 2, 3].some((channel) => (
        Math.abs(actualCanvas.data[index + channel] - expectedCanvas.data[index + channel]) > CHANNEL_TOLERANCE
      ));
      if (different) differentPixels += 1;
      diff.data[index] = different ? 220 : actualCanvas.data[index] * 0.25;
      diff.data[index + 1] = different ? 38 : actualCanvas.data[index + 1] * 0.25;
      diff.data[index + 2] = different ? 38 : actualCanvas.data[index + 2] * 0.25;
      diff.data[index + 3] = 255;
    }
  }

  return {
    actual,
    actualCanvas,
    diff,
    expected,
    expectedCanvas,
    ratio: differentPixels / (width * height),
    sameDimensions: actual.width === expected.width && actual.height === expected.height,
  };
}

function writeDiagnostics(name, comparison) {
  const stem = name.replace(/\.png$/, '');
  fs.mkdirSync(DIFF_DIR, { recursive: true });
  fs.writeFileSync(path.join(DIFF_DIR, `${stem}-actual.png`), PNG.sync.write(comparison.actual));
  fs.writeFileSync(path.join(DIFF_DIR, `${stem}-expected.png`), PNG.sync.write(comparison.expected));
  fs.writeFileSync(path.join(DIFF_DIR, `${stem}-diff.png`), PNG.sync.write(comparison.diff));
}

function assertComparison(name, comparison) {
  const dimensions = `atual ${comparison.actual.width}x${comparison.actual.height}px; esperado ${comparison.expected.width}x${comparison.expected.height}px`;
  if (!comparison.sameDimensions || comparison.ratio > MAX_DIFFERENT_PIXEL_RATIO) {
    writeDiagnostics(name, comparison);
  }
  assert.ok(comparison.sameDimensions, `${name}: dimensões divergentes (${dimensions}). Artefatos: ${DIFF_DIR}`);
  assert.ok(
    comparison.ratio <= MAX_DIFFERENT_PIXEL_RATIO,
    `${name}: ${(comparison.ratio * 100).toFixed(3)}% dos pixels diferem (limite ${(MAX_DIFFERENT_PIXEL_RATIO * 100).toFixed(1)}%). Artefatos: ${DIFF_DIR}`,
  );
}

async function ensureServerAvailable() {
  let response;
  try {
    response = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) });
  } catch (error) {
    throw new Error(`Servidor visual indisponível em ${BASE_URL}. Inicie explicitamente o Vite nessa URL. ${error.message}`);
  }
  if (!response.ok) {
    throw new Error(`Servidor visual em ${BASE_URL} respondeu HTTP ${response.status}; esperava-se uma aplicação disponível.`);
  }
}

async function selectMunicipality(page) {
  const input = page.locator('.context-bar .municipio-selector__input');
  await input.waitFor({ state: 'visible' });
  await input.fill('Áurea');
  await page.getByRole('option', { name: 'Áurea', exact: true }).click();
}

function attachPageDiagnostics(page) {
  const consoleErrors = [];
  const fontResponses = [];
  const fontFailures = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(response.url())) {
      fontResponses.push({ status: response.status(), url: response.url() });
    }
  });
  page.on('requestfailed', (request) => {
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(request.url())) {
      fontFailures.push({ failure: request.failure()?.errorText ?? 'unknown', url: request.url() });
    }
  });
  return { consoleErrors, fontFailures, fontResponses };
}

async function waitForStableRender(page, region, testCase) {
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' });
  const measurements = await page.evaluate(async ({ regionSelector }) => {
    await document.fonts?.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const box = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { height: rect.height, left: rect.left, top: rect.top, width: rect.width };
    };
    const regionElement = document.querySelector(regionSelector);
    const title = regionElement?.querySelector('h1') ?? document.querySelector('main h1, h1');
    const loadingVisible = [...document.querySelectorAll('.state-box--loading, [aria-busy="true"]')]
      .some((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
      });
    const subtitle = title?.nextElementSibling?.tagName === 'P' ? title.nextElementSibling : null;
    const hero = regionElement?.querySelector('.cycle-hero') ?? regionElement?.querySelector(':scope > section');
    const metaCards = [...(regionElement?.querySelectorAll('.meta-card') ?? [])].map(box);
    const firstCard = metaCards[0] ?? null;
    const fourthCard = metaCards[3] ?? null;
    const header = document.querySelector('.app-header') ?? document.querySelector('header');
    const titleStyle = title ? getComputedStyle(title) : null;
    const heroStyle = hero ? getComputedStyle(hero) : null;
    const lineHeight = titleStyle ? Number.parseFloat(titleStyle.lineHeight) : Number.NaN;
    return {
      bodyScrollHeight: document.body.scrollHeight,
      documentScrollHeight: document.documentElement.scrollHeight,
      fonts: {
        status: document.fonts?.status ?? 'unsupported',
        titleLoaded: titleStyle ? document.fonts?.check(`${titleStyle.fontWeight} ${titleStyle.fontSize} ${titleStyle.fontFamily}`) : false,
      },
      header: box(header),
      hero: hero ? {
        box: box(hero),
        marginBottom: heroStyle.marginBottom,
        marginTop: heroStyle.marginTop,
        paddingBottom: heroStyle.paddingBottom,
        paddingTop: heroStyle.paddingTop,
      } : null,
      metaCardGrid: metaCards.length ? {
        cardHeight: firstCard.height,
        firstRowTop: firstCard.top,
        rowGap: fourthCard ? fourthCard.top - firstCard.top - firstCard.height : null,
        secondRowTop: fourthCard?.top ?? null,
      } : null,
      loadingVisible,
      subtitle: box(subtitle),
      title: title ? {
        availableWidth: box(title.parentElement)?.width ?? null,
        box: box(title),
        fontFamily: titleStyle.fontFamily,
        fontSize: titleStyle.fontSize,
        fontWeight: titleStyle.fontWeight,
        lineHeight: titleStyle.lineHeight,
        lines: Number.isFinite(lineHeight) && lineHeight > 0 ? Math.round(title.getBoundingClientRect().height / lineHeight) : null,
      } : null,
    };
  }, { regionSelector: testCase.region });

  assert.equal(measurements.fonts.status, 'loaded', `${testCase.key}: fontes não terminaram de carregar`);
  assert.equal(measurements.fonts.titleLoaded, true, `${testCase.key}: fonte do título não foi carregada`);
  assert.equal(measurements.loadingVisible, false, `${testCase.key}: loading ainda está visível`);
  if (testCase.key === 'pne-2014') {
    assert.match(measurements.title.fontFamily, /Source Serif 4/i, 'PNE 2014: título não usa Source Serif 4');
  }
  return measurements;
}

async function prepareCase(page, testCase) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await selectMunicipality(page);
  if (testCase.navigationHref) {
    const navigationLink = page.locator(`a[href="${testCase.navigationHref}"]`).first();
    if (!(await navigationLink.isVisible().catch(() => false))) {
      await page.locator(`.nav-group--${testCase.navigationGroup} .nav-item--group`)
        .evaluate((element) => element.click());
      await page.waitForFunction(
        (href) => Boolean(document.querySelector(`a[href="${href}"]`)),
        testCase.navigationHref,
      );
    }
    await navigationLink.evaluate((element) => element.click());
  }
  await testCase.open?.(page);
  await page.addStyleTag({ content: '.context-bar{visibility:hidden!important}' });
  const region = page.locator(testCase.region).first();
  await region.waitFor({ state: 'visible' });
  return { measurements: await waitForStableRender(page, region, testCase), region };
}

async function runSnapshot(page, testCase, name, diagnostics) {
  try {
    const { measurements, region } = await prepareCase(page, testCase);
    const baselinePath = path.join(BASELINE_DIR, name);
    const actual = await region.screenshot({ animations: 'disabled' });
    console.log(`[visual] case=${name} viewport=${await page.evaluate(() => `${innerWidth}x${innerHeight}`)} measurements=${JSON.stringify(measurements)} fonts=${JSON.stringify(diagnostics.fontResponses)} fontFailures=${JSON.stringify(diagnostics.fontFailures)} consoleErrors=${JSON.stringify(diagnostics.consoleErrors)}`);
    if (UPDATE) {
      fs.writeFileSync(baselinePath, actual);
      return;
    }
    assert.ok(fs.existsSync(baselinePath), `baseline ausente: ${name}; atualize deliberadamente apenas este caso.`);
    assertComparison(name, comparePng(actual, fs.readFileSync(baselinePath)));
  } catch (error) {
    console.error(`[visual] case=${name} failed before comparison fonts=${JSON.stringify(diagnostics.fontResponses)} fontFailures=${JSON.stringify(diagnostics.fontFailures)} consoleErrors=${JSON.stringify(diagnostics.consoleErrors)}`);
    throw error;
  }
}

async function createPage(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
  return { diagnostics: attachPageDiagnostics(page), page };
}

async function executeSnapshot(page, testCase, name, diagnostics, failures) {
  try {
    await runSnapshot(page, testCase, name, diagnostics);
    console.log(`[visual] result=${name} status=passed`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ message, name });
    console.error(`[visual] result=${name} status=failed message=${message}`);
  }
}

async function run() {
  await ensureServerAvailable();
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
  fs.rmSync(DIFF_DIR, { recursive: true, force: true });
  console.log(`[visual] server=${BASE_URL} commit=${getGitRevision()} filter=${VISUAL_CASE || 'all'} update=${UPDATE}`);
  const browser = await chromium.launch({ headless: true });
  let executed = 0;
  const failures = [];
  try {
    for (const [width, height] of VIEWPORTS) {
      const { diagnostics, page } = await createPage(browser, width, height);
      try {
        for (const testCase of CASES) {
          const name = `${testCase.key}-${width}x${height}.png`;
          if (!shouldRun(name)) continue;
          executed += 1;
          await executeSnapshot(page, testCase, name, diagnostics, failures);
        }
      } finally {
        await page.close();
      }
    }

    for (const mobile of [
      { name: 'pne-2026-390x844.png', testCase: CASES.find((item) => item.key === 'pne-2026') },
      { name: 'pne-2014-390x844.png', testCase: CASES.find((item) => item.key === 'pne-2014') },
    ]) {
      if (!shouldRun(mobile.name)) continue;
      const { diagnostics, page } = await createPage(browser, 390, 844);
      executed += 1;
      try {
        await executeSnapshot(page, mobile.testCase, mobile.name, diagnostics, failures);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  assert.ok(executed > 0, `VISUAL_CASE não corresponde a nenhum cenário: ${VISUAL_CASE}`);
  console.log(`[visual] summary total=${executed} passed=${executed - failures.length} failed=${failures.length}`);
  if (failures.length) {
    throw new Error(`Visual baseline failures:\n${failures.map(({ message, name }) => `- ${name}: ${message}`).join('\n')}`);
  }
  console.log(`Visual baseline passed: ${executed} regiões; tolerância de ${(MAX_DIFFERENT_PIXEL_RATIO * 100).toFixed(1)}%.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
