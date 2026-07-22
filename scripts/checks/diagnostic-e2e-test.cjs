const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const ARTIFACT_DIR = path.resolve('artifacts/diagnostico-dgp5b3r-2026-07-21');
const CASES = [
  { viewport: { width: 1366, height: 768 }, municipality: 'Restinga Seca', slug: 'restinga-seca' },
  { viewport: { width: 1024, height: 768 }, municipality: 'Bento Gonçalves', slug: 'bento-goncalves' },
  { viewport: { width: 768, height: 1024 }, municipality: 'Novo Xingu', slug: 'novo-xingu' },
  { viewport: { width: 390, height: 844 }, municipality: 'Aceguá', slug: 'acegua' },
].map((testCase) => {
  const contract = JSON.parse(fs.readFileSync(
    path.resolve('public/data/municipios', testCase.slug, 'diagnostico.json'),
    'utf8',
  )).pne2026PublicDiagnosticV2;
  return { ...testCase, contract };
});

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

function flatten(contract) {
  return contract.goals.flatMap((goal) => goal.results);
}

async function verifyDiagnostic(page, testCase) {
  const { municipality, viewport, contract } = testCase;
  const label = `${municipality} ${viewport.width}x${viewport.height}`;
  const allResults = flatten(contract);
  const essentials = allResults
    .filter((result) => result.tier === 'essential')
    .sort((left, right) => left.priorityOrder - right.priorityOrder);

  await page.goto(`${BASE_URL}/#diagnostico`, { waitUntil: 'domcontentloaded' });
  await selectMunicipality(page, municipality);
  const diagnostic = page.locator('.pne-diagnostic');
  await diagnostic.waitFor({ state: 'visible' });

  assert.equal(await diagnostic.locator('h1').count(), 1, `${label}: um h1`);
  await diagnostic.getByRole('heading', { name: 'Resumo do diagnóstico' }).waitFor();
  await diagnostic.getByRole('heading', { name: 'Visualização' }).waitFor();
  await diagnostic.getByRole('heading', { name: 'Filtros' }).waitFor();
  await diagnostic.getByRole('heading', { name: 'Resultados essenciais' }).waitFor();
  await diagnostic.getByRole('heading', { name: 'Fontes das informações' }).waitFor();

  const summaryText = await diagnostic.locator('.pne-diagnostic-summary').innerText();
  assert.doesNotMatch(summaryText, /Acima ou próximos do RS|Abaixo do RS|stateComparison/i);
  for (const [labelText, value] of [
    ['Pontos para avançar', contract.summary.advanceCount],
    ['Resultados a manter', contract.summary.maintainCount],
    ['Resultados para acompanhamento', contract.summary.unclassifiedCount],
  ]) {
    assert.equal(
      await diagnostic.locator('.pne-diagnostic-summary-card').filter({ hasText: labelText }).count(),
      value > 0 ? 1 : 0,
      `${label}: resumo ${labelText}`,
    );
  }

  const essentialButton = diagnostic.getByRole('button', { name: 'Resultados essenciais', exact: true });
  const allResultsButton = diagnostic.getByRole('button', { name: 'Todos os resultados', exact: true });
  assert.equal(await essentialButton.getAttribute('aria-pressed'), 'true');
  assert.equal(await allResultsButton.getAttribute('aria-pressed'), 'false');
  assert.equal(await diagnostic.locator('.pne-diagnostic-result').count(), essentials.length);
  assert.deepEqual(
    await diagnostic.locator('.pne-diagnostic-result h3').allTextContents(),
    essentials.map((result) => result.publicName),
    `${label}: ordem editorial dos essenciais`,
  );

  await allResultsButton.focus();
  await allResultsButton.press('Enter');
  assert.equal(await allResultsButton.getAttribute('aria-pressed'), 'true');
  assert.equal(await allResultsButton.evaluate((element) => document.activeElement === element), true);
  assert.equal(await diagnostic.locator('.pne-diagnostic-result').count(), allResults.length);
  assert.equal(await diagnostic.locator('.pne-diagnostic-goal').count(), contract.goals.length);
  assert.equal(await diagnostic.getByText('Resultado essencial', { exact: true }).count(), essentials.length);

  const unclassifiedButton = diagnostic.getByRole('button', {
    name: 'Resultados para acompanhamento',
    exact: true,
  });
  if (contract.summary.unclassifiedCount > 0) {
    await unclassifiedButton.focus();
    await unclassifiedButton.press('Space');
    assert.equal(await unclassifiedButton.getAttribute('aria-pressed'), 'true');
    assert.equal(await unclassifiedButton.evaluate((element) => document.activeElement === element), true);
    assert.equal(
      await diagnostic.locator('.pne-diagnostic-result').count(),
      contract.summary.unclassifiedCount,
    );
    assert.equal(await diagnostic.getByText('Ponto para avançar', { exact: true }).count(), 0);
    assert.equal(await diagnostic.getByText('Resultado a manter', { exact: true }).count(), 0);
  }

  const allSituation = diagnostic.locator('.pne-diagnostic-filter-group').first()
    .getByRole('button', { name: 'Todos', exact: true });
  await allSituation.click();
  const themeButtons = diagnostic.locator('.pne-diagnostic-filter-group').nth(1).locator('button');
  if (await themeButtons.count() > 1) {
    const themeButton = themeButtons.nth(1);
    await themeButton.focus();
    await themeButton.press('Enter');
    const themeCount = await diagnostic.locator('.pne-diagnostic-result').count();
    assert.ok(themeCount > 0 && themeCount < allResults.length, `${label}: filtro de tema`);
    assert.equal(await themeButton.evaluate((element) => document.activeElement === element), true);
    await themeButtons.first().click();
  }

  const proxy = allResults.find((result) => result.relationshipType === 'contextual_proxy');
  if (proxy) {
    const proxyCard = diagnostic.getByRole('heading', { name: proxy.publicName, exact: true })
      .locator('xpath=ancestor::article[contains(@class,"pne-diagnostic-result")]');
    assert.match(await proxyCard.innerText(), /Resultado de contexto/);
    assert.match(
      await proxyCard.innerText(),
      /Este resultado ajuda a contextualizar a meta, mas não mede sozinho o seu cumprimento\./,
    );
  }
  assert.equal(
    await diagnostic.locator('.pne-diagnostic-result__details').count(),
    0,
    `${label}: objetos técnicos sem leitura pública não criam disclosure`,
  );

  const sourceLinks = diagnostic.locator('.pne-diagnostic-sources a');
  assert.equal(await sourceLinks.count(), 3, `${label}: três fontes oficiais completas`);
  const names = await sourceLinks.evaluateAll((links) => links.map((link) => link.getAttribute('aria-label')));
  assert.equal(new Set(names).size, names.length, `${label}: fontes com nomes distintos`);
  for (const link of await sourceLinks.all()) {
    assert.match(await link.getAttribute('aria-label'), /^Acessar fonte oficial: .+ — .+$/);
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.match(await link.getAttribute('rel'), /noreferrer/);
  }

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL });
  await diagnostic.getByRole('button', { name: 'Copiar síntese' }).click();
  await diagnostic.getByRole('button', { name: 'Síntese copiada' }).waitFor();
  const copiedText = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(copiedText, /Resultados essenciais/);
  assert.match(copiedText, /Demais resultados/);
  assert.match(copiedText, /Resultados para acompanhamento:/);
  assert.doesNotMatch(copiedText, /priorityOrder|\btier\b|financiamento|null|undefined|NaN/i);
  for (const result of allResults) {
    assert.equal(copiedText.split(result.publicName).length - 1, 1, `${label}: cópia ${result.indicatorId}`);
  }

  const summaryBeforePrint = await diagnostic.locator('.pne-diagnostic-summary__reading').innerText();
  const advanceButton = diagnostic.getByRole('button', { name: 'Pontos para avançar', exact: true });
  await advanceButton.click();
  const printedCount = await diagnostic.locator('.pne-diagnostic-result').count();
  assert.equal(printedCount, contract.summary.advanceCount);
  assert.equal(await diagnostic.locator('.pne-diagnostic-summary__reading').innerText(), summaryBeforePrint);
  await page.emulateMedia({ media: 'print' });
  assert.equal(await diagnostic.locator('.pne-diagnostic-result').count(), printedCount);
  for (const selector of ['.pne-diagnostic__actions', '.pne-diagnostic-view', '.pne-diagnostic-filters']) {
    assert.equal(
      await diagnostic.locator(selector).evaluate((element) => getComputedStyle(element).display),
      'none',
      `${label}: ${selector} oculto na impressão`,
    );
  }
  const printState = await page.evaluate(() => ({
    shell: getComputedStyle(document.querySelector('.dashboard-shell')).display,
    mobileBar: getComputedStyle(document.querySelector('.sidebar-mobile-bar')).display,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert.equal(printState.shell, 'block');
  assert.equal(printState.mobileBar, 'none');
  assert.ok(printState.scrollWidth <= printState.clientWidth);
  await page.emulateMedia({ media: 'screen' });

  if (municipality === 'Restinga Seca') {
    await selectMunicipality(page, 'Agudo');
    assert.equal(await diagnostic.getByRole('heading', { name: 'Resultados essenciais' }).count(), 1);
    assert.equal(
      await diagnostic.locator('.pne-diagnostic-result').count(),
      CASES.find((item) => item.slug === 'agudo')?.contract.summary.essentialAvailableCount
        ?? JSON.parse(fs.readFileSync(path.resolve('public/data/municipios/agudo/diagnostico.json'), 'utf8'))
          .pne2026PublicDiagnosticV2.summary.essentialAvailableCount,
      `${label}: troca de município remove conteúdo anterior`,
    );
  }

  await assertNoHorizontalOverflow(page, label);
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
    const retry = alert.getByRole('button', { name: 'Tentar novamente' });
    await retry.focus();
    assert.equal(await retry.evaluate((element) => document.activeElement === element), true);
  } finally {
    await context.close();
  }
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
    const button = page.getByRole('button', { name: 'Copiar síntese' });
    await button.focus();
    await button.press('Enter');
    assert.equal(await page.locator('.pne-diagnostic [role="status"]').innerText(), 'Não foi possível copiar a síntese.');
    assert.equal(await button.evaluate((element) => document.activeElement === element), true);
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
      fullPage: true,
      path: path.join(ARTIFACT_DIR, 'restinga-seca-print-a4.png'),
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
    console.log('Diagnóstico DGP5-B3R validado em 1366x768, 1024x768, 768x1024, 390x844 e impressão A4.');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
