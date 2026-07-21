const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const ARTIFACT_DIR = path.resolve('artifacts/diagnostico-dgp3-2026-07-21');
const CASES = [
  { viewport: { width: 1366, height: 768 }, municipality: 'Restinga Seca', expectedResults: 15 },
  { viewport: { width: 1024, height: 768 }, municipality: 'Bento Gonçalves', expectedResults: 20 },
  { viewport: { width: 768, height: 1024 }, municipality: 'Novo Xingu', expectedResults: 18 },
  { viewport: { width: 390, height: 844 }, municipality: 'Aceguá', expectedResults: 18, atMost: true },
];

async function selectMunicipality(page, municipality) {
  const input = page.getByRole('combobox', { name: 'Município' });
  await input.fill(municipality);
  await page.getByRole('option', { name: municipality, exact: true }).click();
  await page.getByRole('heading', {
    level: 1,
    name: `Diagnóstico educacional de ${municipality}`,
  }).waitFor({ state: 'visible' });
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(
    dimensions.scrollWidth <= dimensions.clientWidth,
    `${label}: overflow horizontal (${dimensions.scrollWidth} > ${dimensions.clientWidth})`,
  );
}

async function verifyDiagnostic(page, testCase) {
  const { municipality, expectedResults, viewport } = testCase;
  const label = `${municipality} ${viewport.width}x${viewport.height}`;
  await page.goto(`${BASE_URL}/#diagnostico`, { waitUntil: 'domcontentloaded' });
  await selectMunicipality(page, municipality);

  const diagnostic = page.locator('.pne-diagnostic');
  await diagnostic.waitFor({ state: 'visible' });
  assert.equal(await diagnostic.locator('h1').count(), 1, `${label}: um h1`);
  assert.equal(
    await diagnostic.locator('.pne-diagnostic-result').count(),
    expectedResults,
    `${label}: quantidade de resultados`,
  );
  await diagnostic.getByRole('heading', { name: 'Resumo do diagnóstico' }).waitFor();
  await diagnostic.getByRole('heading', { name: 'Filtros' }).waitFor();
  await diagnostic.getByRole('heading', { name: 'Metas e resultados' }).waitFor();
  await diagnostic.getByRole('heading', { name: 'Fontes das informações' }).waitFor();
  const summaryReading = diagnostic.locator('.pne-diagnostic-summary__reading');
  const originalSummary = await summaryReading.innerText();

  const goalBlocks = diagnostic.locator('.pne-diagnostic-goal');
  assert.ok(await goalBlocks.count() > 0, `${label}: metas visíveis`);
  for (const goal of await goalBlocks.all()) {
    assert.ok(await goal.locator('.pne-diagnostic-result').count() > 0, `${label}: sem meta vazia`);
  }

  const resultIds = await diagnostic.locator('.pne-diagnostic-result h4').allTextContents();
  assert.equal(new Set(resultIds).size, resultIds.length, `${label}: cada resultado aparece uma vez`);

  const firstDisclosure = diagnostic.locator('.pne-diagnostic-result__details').first();
  if (await firstDisclosure.count()) {
    const summary = firstDisclosure.locator(':scope > summary');
    await summary.focus();
    assert.notEqual(
      await summary.evaluate((element) => getComputedStyle(element).outlineWidth),
      '0px',
      `${label}: foco visível no disclosure`,
    );
    assert.equal(await firstDisclosure.evaluate((element) => element.open), false);
    await summary.press('Enter');
    assert.equal(await firstDisclosure.evaluate((element) => element.open), true);
    await summary.press('Enter');
    assert.equal(await firstDisclosure.evaluate((element) => element.open), false);
  }

  const allSituation = diagnostic.getByRole('button', { name: 'Todos', exact: true }).first();
  assert.equal(await allSituation.getAttribute('aria-pressed'), 'true', `${label}: situação inicial Todos`);
  const advanceButton = diagnostic.getByRole('button', { name: 'Pontos para avançar', exact: true });
  await advanceButton.focus();
  await advanceButton.press('Enter');
  assert.equal(await advanceButton.getAttribute('aria-pressed'), 'true');
  assert.equal(
    await advanceButton.evaluate((element) => document.activeElement === element),
    true,
    `${label}: foco permanece no filtro acionado`,
  );
  const advanceCount = await diagnostic.locator('.pne-diagnostic-result').count();
  assert.ok(advanceCount > 0 && advanceCount <= expectedResults, `${label}: filtro de situação`);
  assert.equal(
    await diagnostic.getByText('Resultado a manter', { exact: true }).count(),
    0,
    `${label}: somente resultados a avançar`,
  );
  await allSituation.focus();
  await allSituation.press('Space');
  assert.equal(await allSituation.getAttribute('aria-pressed'), 'true');

  const themeButtons = diagnostic.locator('.pne-diagnostic-filter-group').nth(1).locator('button');
  if (await themeButtons.count() > 1) {
    const themeButton = themeButtons.nth(1);
    await themeButton.focus();
    await themeButton.press('Space');
    assert.equal(await themeButton.getAttribute('aria-pressed'), 'true');
    assert.equal(
      await themeButton.evaluate((element) => document.activeElement === element),
      true,
      `${label}: foco permanece no tema acionado`,
    );
    const filteredCount = await diagnostic.locator('.pne-diagnostic-result').count();
    assert.ok(filteredCount > 0 && filteredCount < expectedResults, `${label}: filtro de tema`);
    await themeButtons.first().click();
  }

  if (municipality === 'Restinga Seca') {
    const themeGroup = diagnostic.locator('.pne-diagnostic-filter-group').nth(1);
    await themeGroup.getByRole('button', { name: 'Atendimento escolar' }).click();
    assert.equal(
      await diagnostic.getByRole('button', { name: 'Resultados a manter', exact: true }).count(),
      0,
      `${label}: combinação sem resultado é removida`,
    );
    await themeGroup.getByRole('button', { name: 'Todos', exact: true }).click();
  }

  if (testCase.atMost) {
    const atMostCard = diagnostic.getByRole('heading', {
      level: 4,
      name: 'Docentes da rede pública com contrato temporário',
    }).locator('xpath=ancestor::article[contains(@class,"pne-diagnostic-result")]');
    assert.match(await atMostCard.innerText(), /Faltam .* para reduzir o resultado/);
  }

  const sourceLinks = diagnostic.locator('.pne-diagnostic-sources a');
  assert.ok(await sourceLinks.count() > 0, `${label}: fontes oficiais`);
  const accessibleSourceNames = await sourceLinks.evaluateAll((links) => links.map(
    (link) => link.getAttribute('aria-label') || link.textContent.trim(),
  ));
  assert.equal(
    new Set(accessibleSourceNames).size,
    accessibleSourceNames.length,
    `${label}: nomes acessíveis distintos para as fontes`,
  );
  for (const link of await sourceLinks.all()) {
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.match(await link.getAttribute('rel'), /noreferrer/);
    assert.doesNotMatch(await link.innerText(), /^https?:\/\//);
    assert.match(await link.getAttribute('aria-label'), /^Acessar fonte oficial: .+ — .+$/);
  }
  await sourceLinks.first().focus();
  assert.notEqual(
    await sourceLinks.first().evaluate((element) => getComputedStyle(element).outlineWidth),
    '0px',
    `${label}: foco visível na fonte`,
  );

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL });
  await diagnostic.getByRole('button', { name: 'Copiar síntese' }).click();
  const copiedButton = diagnostic.getByRole('button', { name: 'Síntese copiada' });
  await copiedButton.waitFor();
  const copiedText = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(copiedText, new RegExp(`Diagnóstico educacional de ${municipality}`));
  assert.match(copiedText, /Fontes das informações/);
  assert.doesNotMatch(copiedText, /financiamento|programas que podem apoiar|decisionSummary/i);
  await copiedButton.press('Enter');
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), copiedText);
  assert.equal(
    await copiedButton.evaluate((element) => document.activeElement === element),
    true,
    `${label}: repetir a cópia preserva o foco`,
  );

  await page.evaluate(() => {
    window.__dgp2PrintCalled = false;
    window.print = () => { window.__dgp2PrintCalled = true; };
  });
  await diagnostic.getByRole('button', { name: 'Imprimir relatório' }).click();
  assert.equal(await page.evaluate(() => window.__dgp2PrintCalled), true, `${label}: impressão acionada`);
  await advanceButton.focus();
  await advanceButton.press('Enter');
  const expectedPrintedResults = await diagnostic.locator('.pne-diagnostic-result').count();
  assert.ok(expectedPrintedResults > 0 && expectedPrintedResults <= expectedResults);
  assert.equal(await summaryReading.innerText(), originalSummary, `${label}: resumo não muda com filtros`);
  await page.emulateMedia({ media: 'print' });
  assert.equal(
    await diagnostic.locator('.pne-diagnostic-result').count(),
    expectedPrintedResults,
    `${label}: impressão preserva o recorte filtrado`,
  );
  assert.equal(
    await diagnostic.locator('.pne-diagnostic-filters').evaluate((element) => getComputedStyle(element).display),
    'none',
    `${label}: filtros ocultos na impressão`,
  );
  const printAudit = await page.evaluate(() => {
    const style = (selector) => getComputedStyle(document.querySelector(selector));
    const diagnosticRect = document.querySelector('.pne-diagnostic').getBoundingClientRect();
    return {
      shellDisplay: style('.dashboard-shell').display,
      mobileBarDisplay: style('.sidebar-mobile-bar').display,
      diagnosticWidth: diagnosticRect.width,
      viewportWidth: document.documentElement.clientWidth,
      headerBorder: style('.pne-diagnostic__header').borderTopWidth,
      goalBorder: style('.pne-diagnostic-goal').borderTopWidth,
      statusBorder: style('.pne-diagnostic-result__status').borderTopWidth,
      sourceDecoration: style('.pne-diagnostic-sources a').textDecorationLine,
    };
  });
  assert.equal(printAudit.shellDisplay, 'block', `${label}: shell linear na impressão`);
  assert.equal(printAudit.mobileBarDisplay, 'none', `${label}: barra móvel oculta na impressão`);
  assert.ok(
    printAudit.diagnosticWidth >= printAudit.viewportWidth * 0.95,
    `${label}: relatório usa a largura da página impressa`,
  );
  assert.notEqual(printAudit.headerBorder, '0px', `${label}: cabeçalho legível na impressão`);
  assert.notEqual(printAudit.goalBorder, '0px', `${label}: metas delimitadas na impressão`);
  assert.notEqual(printAudit.statusBorder, '0px', `${label}: badges delimitados na impressão`);
  assert.match(printAudit.sourceDecoration, /underline/, `${label}: links identificáveis na impressão`);
  await page.emulateMedia({ media: 'screen' });

  const visibleText = (await diagnostic.innerText())
    .replace(/contrato temporário/gi, 'vínculo temporário');
  assert.doesNotMatch(visibleText, /programas que podem apoiar|fontes dos programas|financiamento/i);
  assert.doesNotMatch(
    visibleText,
    /investigação|evidência|governabilidade|pactuação|coorte|proxy|benchmark|percentil|quartil|ranking|score|schema|pipeline|elegibilidade/i,
  );
  await assertNoHorizontalOverflow(page, label);

}

async function verifyClipboardUnavailable(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'clipboard', {
      configurable: true,
      get: () => undefined,
    });
  });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/#diagnostico`, { waitUntil: 'domcontentloaded' });
    await selectMunicipality(page, 'Restinga Seca');
    const diagnostic = page.locator('.pne-diagnostic');
    const copyButton = diagnostic.getByRole('button', { name: 'Copiar síntese' });
    const liveRegion = diagnostic.locator('[role="status"]');
    await copyButton.focus();
    await copyButton.press('Enter');
    assert.equal(await liveRegion.innerText(), 'Não foi possível copiar a síntese.');
    assert.equal(await copyButton.evaluate((element) => document.activeElement === element), true);
    await copyButton.press('Space');
    assert.equal(await liveRegion.innerText(), 'Não foi possível copiar a síntese.');
    assert.equal(await copyButton.evaluate((element) => document.activeElement === element), true);
  } finally {
    await context.close();
  }
}

async function verifyLoadingAndError(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  await page.route('**/municipios/*/diagnostico.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.abort();
  });
  try {
    await page.goto(`${BASE_URL}/#diagnostico`, { waitUntil: 'domcontentloaded' });
    const input = page.getByRole('combobox', { name: 'Município' });
    await input.fill('Restinga Seca');
    await page.getByRole('option', { name: 'Restinga Seca', exact: true }).click();
    const loading = page.getByText('Carregando o diagnóstico de Restinga Seca…', { exact: true });
    await loading.waitFor();
    assert.equal(await loading.locator('xpath=ancestor-or-self::*[@role="status"]').count(), 1);
    const alert = page.getByRole('alert');
    await alert.waitFor();
    assert.match(await alert.innerText(), /Não foi possível abrir o diagnóstico agora/);
    assert.doesNotMatch(await alert.innerText(), /JSON|schema|pipeline|API|fetch/i);
    const retry = alert.getByRole('button', { name: 'Tentar novamente' });
    await retry.focus();
    assert.equal(await retry.evaluate((element) => document.activeElement === element), true);
    await Promise.all([
      page.waitForEvent('framenavigated'),
      retry.press('Enter'),
    ]);
    await page.getByRole('alert').waitFor();
  } finally {
    await context.close();
  }
}

async function capturePrintEvidence(browser) {
  const context = await browser.newContext({ viewport: { width: 794, height: 1123 } });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/#diagnostico`, { waitUntil: 'domcontentloaded' });
    await selectMunicipality(page, 'Restinga Seca');
    await page.emulateMedia({ media: 'print' });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'restinga-seca-print-a4-retrato.png'),
    });
  } finally {
    await context.close();
  }
}

async function run() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const testCase of CASES) {
      const context = await browser.newContext({ viewport: testCase.viewport });
      const page = await context.newPage();
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`${testCase.municipality}: ${message.text()}`);
      });
      page.on('pageerror', (error) => errors.push(`${testCase.municipality}: ${error.message}`));
      try {
        await verifyDiagnostic(page, testCase);
      } finally {
        await context.close();
      }
    }
    await verifyLoadingAndError(browser);
    await verifyClipboardUnavailable(browser);
    await capturePrintEvidence(browser);
    assert.deepEqual(errors, [], `Erros no navegador:\n${errors.join('\n')}`);
    console.log('Diagnóstico DGP3 validado em 1366x768, 1024x768, 768x1024, 390x844 e impressão A4.');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
