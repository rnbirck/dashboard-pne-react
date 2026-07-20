const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const MUNICIPALITY = 'Agudo';
const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
];
const ARTIFACT_DIR = path.resolve('artifacts/diagnostico-p4b-2026-07-20');

async function selectMunicipality(page) {
  const input = page.getByRole('combobox', { name: 'Município' });
  await input.fill(MUNICIPALITY);
  await page.getByRole('option', { name: MUNICIPALITY, exact: true }).click();
  await page.getByRole('heading', { level: 1, name: new RegExp(`^${MUNICIPALITY}:`) })
    .waitFor({ state: 'visible' });
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

async function verifyDiagnostic(page, viewport) {
  const label = `${viewport.width}x${viewport.height}`;
  await page.goto(`${BASE_URL}/#diagnostico`, { waitUntil: 'domcontentloaded' });
  await selectMunicipality(page);

  const stateSection = page.locator('.diagnostic-state-benchmark');
  await stateSection.waitFor({ state: 'visible' });
  const stateText = await stateSection.innerText();
  const summaryValues = [...stateText.matchAll(/\b(\d+)\b/g)].map((match) => Number(match[1]));
  assert.ok(summaryValues.some((value) => value > 0), `${label}: resumo estadual não pode ser quatro zeros`);
  assert.ok(await stateSection.getByText(/Referência RS .* · 20\d{2}/).count() > 0, `${label}: ano estadual visível`);

  const priorities = page.locator('.diagnostic-decision-summary');
  await priorities.getByRole('heading', { name: 'Síntese para decisão' }).waitFor();
  const actionItems = priorities.locator('.diagnostic-decision-group--action .diagnostic-decision-item');
  const coordinationItems = priorities.locator('.diagnostic-decision-group--coordination .diagnostic-decision-item');
  assert.ok(await actionItems.count() <= 3, `${label}: no máximo três ações municipais`);
  assert.ok(await coordinationItems.count() <= 2, `${label}: no máximo duas pactuações`);
  const decisionItems = priorities.locator('.diagnostic-decision-item');
  for (const item of await decisionItems.all()) {
    const lineCount = await item.locator('.diagnostic-priorities__decision-line').count();
    assert.ok(lineCount <= 2, `${label}: no máximo duas linhas analíticas`);
    const itemHeight = await item.evaluate((element) => element.getBoundingClientRect().height);
    assert.ok(
      itemHeight <= (viewport.width <= 390 ? 360 : 280),
      `${label}: item decisório cresceu excessivamente (${itemHeight}px)`,
    );
  }
  const investigation = priorities.locator('.diagnostic-investigation-summary');
  assert.equal(await investigation.getAttribute('open'), null, `${label}: investigação fechada por padrão`);
  await investigation.locator(':scope > summary').click();
  const investigationGroups = investigation.locator('.diagnostic-investigation-group');
  assert.equal(await investigationGroups.count(), 4, `${label}: quatro grupos de investigação`);
  for (const group of await investigationGroups.all()) {
    const nestedDetails = group.locator(':scope > details');
    const overflowY = await nestedDetails.evaluate((element) => getComputedStyle(element).overflowY);
    assert.notEqual(overflowY, 'auto', `${label}: investigação sem rolagem interna`);
    assert.notEqual(overflowY, 'scroll', `${label}: investigação sem rolagem interna`);
    assert.equal(
      await nestedDetails.locator(':scope > summary').innerText(),
      'Consultar evidências e limitações',
      `${label}: acesso metodológico do grupo`,
    );
  }
  await investigation.locator(':scope > summary').click();
  assert.equal(await investigation.getAttribute('open'), null, `${label}: investigação pode voltar ao estado compacto`);
  assert.ok(
    await page.getByRole('heading', { name: 'Resultados a preservar e acompanhar' }).count() > 0,
    `${label}: preservação e acompanhamento apresentados separadamente`,
  );
  assert.ok(await page.getByRole('heading', { name: 'Preservar' }).count() > 0);
  assert.ok(await page.getByRole('heading', { name: 'Acompanhar' }).count() > 0);
  assert.ok(await page.getByText(/estão em acompanhamento/).count() > 0, `${label}: monitoramento na síntese`);
  assert.equal(await page.getByText(/municípios semelhantes|perfil semelhante|pares socioeconômicos/i).count(), 0);
  assert.equal(await page.locator('.inequality-pilot').count(), 0, `${label}: piloto ausente do Diagnóstico principal`);
  const financing = page.locator('.diagnostic-financing');
  const themes = page.locator('.diagnostic-themes-stack');
  const positions = await Promise.all([priorities, financing, themes].map((locator) => (
    locator.evaluate((element) => element.getBoundingClientRect().top)
  )));
  assert.ok(positions[0] < positions[1] && positions[1] < positions[2], `${label}: hierarquia da página preservada`);

  const fronts = financing.locator('.diagnostic-financing-block');
  const frontCount = await fronts.count();
  assert.ok(frontCount > 0 && frontCount <= 3, `${label}: síntese usa de uma a três frentes`);
  let mechanismCount = 0;
  for (const front of await fronts.all()) {
    const mechanisms = front.locator('li');
    const count = await mechanisms.count();
    mechanismCount += count;
    assert.ok(count <= 3, `${label}: cada frente usa no máximo três mecanismos`);
    assert.equal(await front.locator('a').count(), 1, `${label}: uma navegação por frente`);
  }
  assert.ok(mechanismCount <= 9, `${label}: limite agregado de mecanismos`);
  assert.equal(await financing.getByText('Situação municipal não verificada', { exact: true }).count(), 0);
  assert.equal(await financing.getByText(/SIOPE|SICONFI|FINBRA/).count(), 0);
  assert.equal(await financing.getByText(/VAAF|VAAT|Salário-Educação/).count(), 0);
  assert.equal(
    await financing.getByText(
      'Fontes gerais de MDE podem apoiar diferentes ações, observadas as regras de aplicação e a disponibilidade orçamentária municipal.',
      { exact: true },
    ).count(),
    1,
  );

  const exploreAll = financing.getByRole('link', { name: 'Abrir panorama financeiro do município' });
  assert.equal(await exploreAll.count(), 1, `${label}: navegação geral única`);
  const exploreHref = await exploreAll.getAttribute('href');
  assert.match(exploreHref, /^#financeiros-panorama\?/);
  const exploreParams = new URLSearchParams(exploreHref.split('?')[1]);
  assert.equal(exploreParams.get('municipio'), 'agudo');
  assert.ok(exploreParams.get('indicatorId'));
  assert.ok(exploreParams.get('programId'));
  assert.ok(exploreParams.get('indicatorId').split(',').length <= 5);

  await exploreAll.focus();
  const focusStyle = await exploreAll.evaluate((element) => getComputedStyle(element).outlineWidth);
  assert.notEqual(focusStyle, '0px', `${label}: foco visível no link geral`);

  const sectionHeights = await Promise.all([priorities, financing].map((locator) => (
    locator.evaluate((element) => element.getBoundingClientRect().height)
  )));
  assert.ok(
    sectionHeights[0] <= (viewport.width <= 390 ? 2100 : 1500),
    `${label}: síntese decisória cresceu excessivamente`,
  );

  const financingOverflow = await financing.evaluate((element) => getComputedStyle(element).overflowY);
  assert.notEqual(financingOverflow, 'scroll', `${label}: financiamento sem rolagem interna`);
  assert.notEqual(financingOverflow, 'auto', `${label}: financiamento sem rolagem interna`);
  await assertNoHorizontalOverflow(page, `Diagnóstico ${label}`);

  if (viewport.width === 1366 || viewport.width === 390) {
    await page.addStyleTag({ content: '.context-bar { position: static !important; }' });
    await page.locator('.diagnostic-panel').screenshot({
      path: path.join(ARTIFACT_DIR, `agudo-${label}.png`),
    });
  }
}

async function verifyPilotDetail(page, viewport) {
  const label = `${viewport.width}x${viewport.height}`;
  const diagnosticRequests = [];
  page.on('request', (request) => {
    if (/\/data\/municipios\/[^/]+\/diagnostico\.json$/.test(new URL(request.url()).pathname)) {
      diagnosticRequests.push(request.url());
    }
  });
  await page.goto(
    `${BASE_URL}/?pilot-e2e=${viewport.width}#pne2026?detalhe=basico_integral`,
    { waitUntil: 'domcontentloaded' },
  );
  const input = page.getByRole('combobox', { name: 'Município' });
  await input.fill(MUNICIPALITY);
  await page.getByRole('option', { name: MUNICIPALITY, exact: true }).click();
  await page.getByRole('heading', {
    level: 2,
    name: 'Alunos do público-alvo da ETI em jornada integral na rede pública',
  }).waitFor({ state: 'visible' });

  const pilot = page.locator('.inequality-pilot');
  await pilot.waitFor({ state: 'visible' });
  await pilot.getByRole('heading', { name: 'Oferta em tempo integral por localização' }).waitFor();
  assert.equal(await pilot.locator('.inequality-pilot__group').count(), 2, `${label}: dois recortes`);
  assert.equal(await pilot.getByText('Resultado urbano', { exact: true }).count(), 1);
  assert.equal(await pilot.getByText('Resultado rural', { exact: true }).count(), 1);
  assert.equal(await pilot.getByText(/Diferença observada:/).count(), 1);
  assert.equal(
    await pilot.getByText(
      'Este recorte descreve diferenças na oferta observada. Não demonstra, sozinho, causa, qualidade ou igualdade de acesso dos estudantes residentes.',
      { exact: true },
    ).count(),
    1,
  );
  assert.equal(diagnosticRequests.length, 1, `${label}: contrato aprofundado carregado uma vez no detalhe`);
  await assertNoHorizontalOverflow(page, `Piloto P4-B ${label}`);
  if (viewport.width === 1366 || viewport.width === 390) {
    await page.addStyleTag({ content: '.context-bar { position: static !important; }' });
    await pilot.screenshot({ path: path.join(ARTIFACT_DIR, `agudo-piloto-${label}.png`) });
  }
}

async function run() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`${viewport.width}x${viewport.height}: ${message.text()}`);
      });
      page.on('pageerror', (error) => errors.push(`${viewport.width}x${viewport.height}: ${error.message}`));
      try {
        await verifyDiagnostic(page, viewport);
        await verifyPilotDetail(page, viewport);
      } finally {
        await context.close();
      }
    }
    assert.deepEqual(errors, [], `Erros no navegador:\n${errors.join('\n')}`);
    console.log('Diagnóstico e piloto P4-B validados em 1366x768, 1280x720, 1024x768 e 390x844.');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
