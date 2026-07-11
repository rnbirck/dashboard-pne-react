const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const MUNICIPALITY = '\u00c1urea';
const PNE_2014 = 'PNE 2014\u20132024';
const PNE_2026 = 'PNE 2026\u20132036';
const EDUCATION = 'Indicadores de Educa\u00e7\u00e3o';
const FINANCE = 'Indicadores Financeiros da Educa\u00e7\u00e3o';
const LEGAL_GOALS = 'Metas legais';
const LEGAL_GOALS_TITLE = 'Metas legais do PNE 2026\u20132036';
const EDUCATION_EMPTY = 'Nenhum indicador dispon\u00edvel para este tema ou busca.';
const LEGAL_GOALS_EMPTY = 'Nenhuma meta com acompanhamento municipal compar\u00e1vel encontrada para os filtros selecionados.';
const EXPLORABLE_CARD_NAME = /^Abrir detalhe do indicador /;
const BASIC_EDUCATION_STAGES = 'Etapas da Educa\u00e7\u00e3o B\u00e1sica';
const EDUCATION_HISTORY_CUT = 'Recorte do hist\u00f3rico do indicador';
const WIDE_STAGE_CARD = 'Abrir detalhe do indicador Alunos por turma - Ensino Fundamental';
const FUNDEB_METHOD_NOTE = 'Nota metodológica: Série exibida a partir de 2021 para manter comparabilidade com a estrutura do Novo FUNDEB.';
const FUNDEB_SOURCE = 'Fonte: SIOPE / FNDE';
const PNATE_METHOD_NOTE = 'Nota metodológica: Os arquivos do PNATE podem alternar entre previsao/plano de atendimento e atendimento anual conforme o exercicio.';
const PNATE_SOURCE = 'Fonte: PNATE / FNDE';
const PNATE_FINANCIAL_ALERT = 'Atenção: o último registro indica repasse não autorizado para este município.';
const SIOPE_SOURCE = 'Fonte: SIOPE / FNDE';
const SIOPE_METHOD_NOTE = 'Nota metodológica: Para cada ano, foi considerado o dado declarado no 6º bimestre.';
const SIOPE_MUNICIPALITY_2025_MISSING_NOTE = 'Este município ainda não possui dados de 2025 no SIOPE. Exibindo o último ano disponível.';
const SIOPE_REGISTER_ALERT = 'Registro: Este município não possui dado para este indicador neste ano.';
const SIOPE_2025_MISSING_MUNICIPALITY = 'Alegrete';
const SISTEMA_S_SOURCE = 'Fonte: Censo Escolar / Sinopse Estatística da Educação Básica — INEP';
const SISTEMA_S_FIXTURE_PATH = '/data/educacao/municipios/4300406.json';
const DATA_SOURCE_LABEL_COLOR = 'rgb(106, 101, 89)';
const DATA_SOURCE_MIN_CONTRAST = 4.5;
const FUNDEB_METHOD_INDICATORS = [
  {
    cardName: 'Abrir detalhe do indicador Remuneração em creche',
    name: 'Remuneração em creche',
  },
  {
    cardName: 'Abrir detalhe do indicador Remuneração na pré-escola',
    name: 'Remuneração na pré-escola',
  },
];
const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
];
const MOBILE_DATA_SOURCE_VIEWPORT = { width: 390, height: 844 };

const dataSourceLegibilityEvidence = [];

async function waitForPageTitle(page, name) {
  await page.getByRole('heading', { level: 1, name, exact: true }).waitFor({ state: 'visible' });
}

async function assertNoHorizontalOverflow(page, context) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  assert.ok(
    metrics.scrollWidth <= metrics.viewportWidth,
    `${context}: overflow horizontal (${metrics.scrollWidth}px > ${metrics.viewportWidth}px)`,
  );
}

async function assertDataSourceLegibility(note, context) {
  await note.waitFor({ state: 'visible' });

  const evidence = await note.evaluate((element) => {
    const parseColor = (value) => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return channels.length >= 3 ? channels : null;
    };
    const relativeLuminance = (channels) => channels
      .slice(0, 3)
      .map((channel) => {
        const value = channel / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const contrast = (foreground, background) => {
      const [light, dark] = [relativeLuminance(foreground), relativeLuminance(background)]
        .sort((a, b) => b - a);
      return (light + 0.05) / (dark + 0.05);
    };
    const opaqueBackground = (start) => {
      let current = start.parentElement;
      while (current) {
        const color = parseColor(getComputedStyle(current).backgroundColor);
        if (color && (color[3] ?? 1) === 1) return color;
        current = current.parentElement;
      }
      return parseColor(getComputedStyle(document.body).backgroundColor);
    };
    const style = getComputedStyle(element);
    const label = element.querySelector('.data-source-note__label');
    const text = element.querySelector('.data-source-note__text');
    const background = opaqueBackground(element);
    const lineHeight = Number.parseFloat(style.lineHeight);
    const height = element.getBoundingClientRect().height;

    return {
      background: `rgb(${background.slice(0, 3).join(', ')})`,
      color: style.color,
      contrast: contrast(parseColor(style.color), background),
      fontSize: Number.parseFloat(style.fontSize),
      height,
      labelColor: getComputedStyle(label).color,
      labelContrast: contrast(parseColor(getComputedStyle(label).color), background),
      labelFontSize: Number.parseFloat(getComputedStyle(label).fontSize),
      lineCount: Math.max(1, Math.round(height / lineHeight)),
      lineHeight,
      scrollWidth: element.scrollWidth,
      textColor: getComputedStyle(text).color,
      textContrast: contrast(parseColor(getComputedStyle(text).color), background),
      textFontSize: Number.parseFloat(getComputedStyle(text).fontSize),
      width: element.clientWidth,
    };
  });

  assert.ok(evidence.fontSize >= 12, `${context}: fonte da atribuição deve ter no mínimo 12 px`);
  assert.ok(evidence.labelFontSize >= 12, `${context}: rótulo da atribuição deve ter no mínimo 12 px`);
  assert.ok(evidence.textFontSize >= 12, `${context}: origem deve ter no mínimo 12 px`);
  assert.equal(evidence.labelColor, DATA_SOURCE_LABEL_COLOR, `${context}: cor computada do rótulo`);
  assert.ok(evidence.contrast >= DATA_SOURCE_MIN_CONTRAST, `${context}: contraste AA da atribuição`);
  assert.ok(evidence.labelContrast >= DATA_SOURCE_MIN_CONTRAST, `${context}: contraste AA do rótulo`);
  assert.ok(evidence.textContrast >= DATA_SOURCE_MIN_CONTRAST, `${context}: contraste AA da origem`);
  assert.ok(evidence.scrollWidth <= evidence.width, `${context}: fonte não deve causar overflow horizontal`);

  dataSourceLegibilityEvidence.push({ context, ...evidence });
}

async function selectMunicipality(page) {
  const municipalityInput = page.getByRole('combobox', { name: 'Munic\u00edpio' });
  await municipalityInput.fill(MUNICIPALITY);
  await page.getByRole('option', { name: MUNICIPALITY, exact: true }).click();
  await page.getByRole('button', { name: 'Limpar sele\u00e7\u00e3o' }).waitFor({ state: 'visible' });
  await page.getByRole('heading', { level: 1, name: new RegExp(MUNICIPALITY) }).waitFor({ state: 'visible' });
}

async function navigateTo(page, navigationName, pageTitle) {
  await page.getByRole('button', { name: navigationName, exact: true }).click();
  await waitForPageTitle(page, pageTitle);
}

async function firstExplorableCard(page) {
  const card = page.getByRole('button', { name: EXPLORABLE_CARD_NAME }).first();
  await card.waitFor({ state: 'visible' });
  return card;
}

async function selectedPressedButton(scope, context) {
  const selected = scope.locator('button[aria-pressed="true"]');
  await selected.waitFor({ state: 'visible' });
  assert.equal(await selected.count(), 1, `${context}: deve haver uma única opção ativa`);
  return selected;
}

async function verifyPne2014Flow(page, viewport) {
  await navigateTo(page, PNE_2014, PNE_2014);
  await page.getByLabel('Buscar meta').waitFor({ state: 'visible' });
  await assertDataSourceLegibility(
    page.locator('.data-source-note').first(),
    `${PNE_2014} em ${viewport.width}x${viewport.height}`,
  );
  await assertNoHorizontalOverflow(page, `${PNE_2014} em ${viewport.width}x${viewport.height}`);

  const cards = page.getByRole('button', { name: EXPLORABLE_CARD_NAME });
  const initialCardCount = await cards.count();
  assert.ok(initialCardCount > 0, `${PNE_2014}: deve haver ao menos um card explorável`);

  const card = await firstExplorableCard(page);
  const cardName = await card.getAttribute('aria-label');
  assert.ok(cardName, `${PNE_2014}: card explorável deve ter nome acessível`);

  const indicatorName = cardName.replace('Abrir detalhe do indicador ', '');
  await page.getByLabel('Buscar meta').fill(indicatorName);

  const filteredCard = page.getByRole('button', { name: cardName, exact: true });
  await filteredCard.waitFor({ state: 'visible' });
  assert.equal(
    await cards.count(),
    1,
    `${PNE_2014}: a busca pelo nome completo deve restringir a lista ao card correspondente`,
  );

  await filteredCard.click();
  const backButton = page.getByRole('button', { name: 'Voltar aos indicadores' }).first();
  await backButton.waitFor({ state: 'visible' });
  await assertNoHorizontalOverflow(page, `${PNE_2014} em detalhe, ${viewport.width}x${viewport.height}`);

  await backButton.click();
  await filteredCard.waitFor({ state: 'visible' });
  await page.waitForFunction(
    (name) => document.activeElement?.getAttribute('aria-label') === name,
    cardName,
  );

  const stages = page.getByRole('group', { name: BASIC_EDUCATION_STAGES });
  const allStages = stages.getByRole('button');
  const allStagesOption = stages.getByRole('button', { name: 'Todos', exact: true });
  const infantStage = stages.getByRole('button', { name: 'Educa\u00e7\u00e3o Infantil', exact: true });
  const fundamentalStage = stages.getByRole('button', { name: 'Ensino Fundamental', exact: true });
  const mediumStage = stages.getByRole('button', { name: 'Ensino M\u00e9dio', exact: true });
  await stages.waitFor({ state: 'visible' });
  assert.equal(await allStages.count(), 4, `${PNE_2014}: etapas da educa\u00e7\u00e3o b\u00e1sica`);
  assert.equal(await (await selectedPressedButton(stages, PNE_2014)).innerText(), 'Todos', `${PNE_2014}: etapa inicial`);

  await allStagesOption.focus();
  await page.keyboard.press('Tab');
  assert.equal(await infantStage.evaluate((element) => document.activeElement === element), true, `${PNE_2014}: Tab alcan\u00e7a a pr\u00f3xima etapa`);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await allStagesOption.evaluate((element) => document.activeElement === element), true, `${PNE_2014}: Shift+Tab retorna \u00e0 etapa anterior`);
  await page.keyboard.press('ArrowRight');
  assert.equal(await allStagesOption.evaluate((element) => document.activeElement === element), true, `${PNE_2014}: setas n\u00e3o operam como tabs`);
  assert.equal(await allStagesOption.getAttribute('aria-pressed'), 'true', `${PNE_2014}: seta n\u00e3o altera a etapa`);

  await infantStage.focus();
  await page.keyboard.press('Enter');
  assert.equal(await infantStage.getAttribute('aria-pressed'), 'true', `${PNE_2014}: Enter seleciona etapa`);
  assert.equal(await (await selectedPressedButton(stages, PNE_2014)).innerText(), 'Educa\u00e7\u00e3o Infantil', `${PNE_2014}: uma etapa ativa ap\u00f3s Enter`);
  assert.equal(await page.getByLabel('Buscar meta').inputValue(), '', `${PNE_2014}: troca de etapa limpa a busca`);
  assert.ok(await cards.count() > 0 && await cards.count() < initialCardCount, `${PNE_2014}: troca de etapa restaura a lista filtrada`);

  await fundamentalStage.focus();
  await page.keyboard.press('Space');
  assert.equal(await fundamentalStage.getAttribute('aria-pressed'), 'true', `${PNE_2014}: Espa\u00e7o seleciona etapa`);
  assert.equal(await (await selectedPressedButton(stages, PNE_2014)).innerText(), 'Ensino Fundamental', `${PNE_2014}: uma etapa ativa ap\u00f3s Espa\u00e7o`);
  assert.equal(await mediumStage.getAttribute('aria-pressed'), 'false', `${PNE_2014}: etapas permanecem exclusivas`);
  await assertNoHorizontalOverflow(page, `${PNE_2014} com etapas em ${viewport.width}x${viewport.height}`);
}

async function verifyPne2026Flow(page, viewport) {
  await navigateTo(page, PNE_2026, PNE_2026);
  await firstExplorableCard(page);
  await assertDataSourceLegibility(
    page.locator('.data-source-note').first(),
    `${PNE_2026} em ${viewport.width}x${viewport.height}`,
  );
  await assertNoHorizontalOverflow(page, `${PNE_2026} em ${viewport.width}x${viewport.height}`);
}

async function verifyEducationFlow(page, viewport) {
  await navigateTo(page, EDUCATION, EDUCATION);
  const searchInput = page.getByLabel('Buscar indicador');
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.focus();
  assert.equal(await searchInput.evaluate((element) => document.activeElement === element), true, 'Educação: foco da busca');
  assert.equal(await searchInput.getAttribute('aria-label'), 'Buscar indicador', 'Educação: nome acessível da busca');

  const themes = page.getByRole('group', { name: 'Temas da educa\u00e7\u00e3o' });
  const selectedTheme = await selectedPressedButton(themes, 'Educação');
  const selectedThemeName = await selectedTheme.innerText();
  const cards = page.getByRole('button', { name: EXPLORABLE_CARD_NAME });
  const initialCount = await cards.count();
  assert.ok(initialCount > 0, 'Educação: deve haver indicadores no tema ativo');

  const card = await firstExplorableCard(page);
  const cardName = await card.getAttribute('aria-label');
  await searchInput.fill(cardName.replace('Abrir detalhe do indicador ', ''));
  await page.getByRole('button', { name: cardName, exact: true }).waitFor({ state: 'visible' });
  const foundCount = await cards.count();
  assert.ok(foundCount > 0 && foundCount < initialCount, 'Educação: busca deve restringir o tema ativo');
  assert.equal(await (await selectedPressedButton(themes, 'Educação')).innerText(), selectedThemeName, 'Educação: tema ativo após resultado');

  await searchInput.fill('consulta sem resultado');
  await page.getByText(EDUCATION_EMPTY, { exact: true }).waitFor({ state: 'visible' });
  assert.equal(await cards.count(), 0, 'Educação: busca sem resultado');
  assert.equal(await (await selectedPressedButton(themes, 'Educação')).innerText(), selectedThemeName, 'Educação: tema ativo sem resultado');

  await searchInput.fill('');
  await page.getByRole('button', { name: cardName, exact: true }).waitFor({ state: 'visible' });
  assert.equal(await cards.count(), initialCount, 'Educação: limpeza manual restaura a lista');
  assert.equal(await (await selectedPressedButton(themes, 'Educação')).innerText(), selectedThemeName, 'Educação: tema ativo após limpeza');
  const studentsPerClassTheme = themes.getByRole('button', { name: /Alunos por turma/ });
  await studentsPerClassTheme.click();
  assert.equal(await studentsPerClassTheme.getAttribute('aria-pressed'), 'true', 'Educa\u00e7\u00e3o: tema de alunos por turma ativo');

  const wideStageCard = page.getByRole('button', { name: WIDE_STAGE_CARD, exact: true });
  await wideStageCard.click();
  const historyCut = page.getByRole('group', { name: EDUCATION_HISTORY_CUT });
  const historyOptions = historyCut.getByRole('button');
  const totalStage = historyCut.getByRole('button', { name: 'Total - Ensino Fundamental', exact: true });
  const initialStage = historyCut.getByRole('button', { name: 'Anos Iniciais', exact: true });
  const finalStage = historyCut.getByRole('button', { name: 'Anos Finais', exact: true });
  await historyCut.waitFor({ state: 'visible' });
  assert.equal(await historyCut.getAttribute('role'), 'group', 'Educa\u00e7\u00e3o: segmento usa grupo, n\u00e3o tablist');
  assert.equal(await historyCut.getByRole('tab').count(), 0, 'Educa\u00e7\u00e3o: segmento n\u00e3o possui tabs');
  assert.ok(await historyOptions.count() > 4, 'Educa\u00e7\u00e3o: recorte amplo preserva mais de quatro op\u00e7\u00f5es');
  assert.equal(await (await selectedPressedButton(historyCut, 'Educa\u00e7\u00e3o')).innerText(), 'Total - Ensino Fundamental', 'Educa\u00e7\u00e3o: recorte inicial');

  await totalStage.focus();
  await page.keyboard.press('Tab');
  assert.equal(await initialStage.evaluate((element) => document.activeElement === element), true, 'Educa\u00e7\u00e3o: Tab alcan\u00e7a a pr\u00f3xima op\u00e7\u00e3o');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await totalStage.evaluate((element) => document.activeElement === element), true, 'Educa\u00e7\u00e3o: Shift+Tab retorna \u00e0 op\u00e7\u00e3o anterior');

  await initialStage.focus();
  await page.keyboard.press('Enter');
  await page.getByText(/Recorte exibido: Anos Iniciais/).waitFor({ state: 'visible' });
  assert.equal(await initialStage.getAttribute('aria-pressed'), 'true', 'Educa\u00e7\u00e3o: Enter atualiza o recorte');
  assert.equal(await (await selectedPressedButton(historyCut, 'Educa\u00e7\u00e3o')).innerText(), 'Anos Iniciais', 'Educa\u00e7\u00e3o: uma op\u00e7\u00e3o ativa ap\u00f3s Enter');

  await finalStage.focus();
  await page.keyboard.press('Space');
  await page.getByText(/Recorte exibido: Anos Finais/).waitFor({ state: 'visible' });
  assert.equal(await finalStage.getAttribute('aria-pressed'), 'true', 'Educa\u00e7\u00e3o: Espa\u00e7o atualiza o recorte');
  await page.keyboard.press('ArrowRight');
  assert.equal(await finalStage.evaluate((element) => document.activeElement === element), true, 'Educa\u00e7\u00e3o: setas n\u00e3o operam como tabs');
  assert.equal(await finalStage.getAttribute('aria-pressed'), 'true', 'Educa\u00e7\u00e3o: seta n\u00e3o altera o recorte');
  await assertDataSourceLegibility(
    page.locator('.data-source-note').first(),
    `Educação em ${viewport.width}x${viewport.height}`,
  );
  await assertNoHorizontalOverflow(page, `${EDUCATION} em ${viewport.width}x${viewport.height}`);
}

async function verifyLegalGoalsFlow(page, viewport) {
  await navigateTo(page, LEGAL_GOALS, LEGAL_GOALS_TITLE);
  const searchInput = page.getByLabel('Buscar metas legais');
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.focus();
  assert.equal(await searchInput.evaluate((element) => document.activeElement === element), true, 'Metas legais: foco da busca');
  assert.equal(await searchInput.getAttribute('aria-label'), 'Buscar metas legais', 'Metas legais: nome acessível da busca');

  const themeControls = page.locator('[aria-label="Temas das metas"]');
  const attendanceTheme = themeControls.getByRole('button', { name: 'Atendimento Escolar', exact: true });
  await attendanceTheme.click();
  assert.equal(await attendanceTheme.getAttribute('aria-pressed'), 'true', 'Metas legais: tema ativo');

  const resultMeta = page.getByText(/metas acompanhadas exibidas/).first();
  const initialText = await resultMeta.innerText();
  const initialCount = Number(initialText.match(/^\d+/)?.[0]);
  assert.ok(initialCount > 0, 'Metas legais: deve haver metas no tema ativo');

  await searchInput.fill('1.a');
  const foundCount = Number((await resultMeta.innerText()).match(/^\d+/)?.[0]);
  assert.ok(foundCount > 0 && foundCount <= initialCount, 'Metas legais: busca deve manter metas encontradas');
  assert.equal(await attendanceTheme.getAttribute('aria-pressed'), 'true', 'Metas legais: tema ativo após resultado');

  await searchInput.fill('consulta sem resultado');
  await page.getByText(LEGAL_GOALS_EMPTY, { exact: true }).waitFor({ state: 'visible' });
  assert.equal(Number((await resultMeta.innerText()).match(/^\d+/)?.[0]), 0, 'Metas legais: busca sem resultado');
  assert.equal(await attendanceTheme.getAttribute('aria-pressed'), 'true', 'Metas legais: tema ativo sem resultado');

  await searchInput.fill('');
  await page.getByText(initialText, { exact: true }).waitFor({ state: 'visible' });
  assert.equal(Number((await resultMeta.innerText()).match(/^\d+/)?.[0]), initialCount, 'Metas legais: limpeza manual restaura a lista');
  assert.equal(await attendanceTheme.getAttribute('aria-pressed'), 'true', 'Metas legais: tema ativo após limpeza');
  const expandedGoal = page.getByRole('button', { name: /^Meta 1\.a/ });
  await expandedGoal.click();
  assert.equal(await expandedGoal.getAttribute('aria-expanded'), 'true', 'Metas legais: meta com fonte é expandida');
  await assertDataSourceLegibility(
    page.locator('.data-source-note').first(),
    `Metas legais em ${viewport.width}x${viewport.height}`,
  );
  await assertNoHorizontalOverflow(page, `${LEGAL_GOALS} em ${viewport.width}x${viewport.height}`);
}

async function verifyFinanceFlow(page, viewport) {
  await navigateTo(page, FINANCE, FINANCE);

  const moduleTabs = page.getByRole('tablist', {
    name: 'M\u00f3dulos de financiamento da educa\u00e7\u00e3o',
  });
  await moduleTabs.waitFor({ state: 'visible' });

  const siopeTab = moduleTabs.getByRole('tab', { name: /Aplica\u00e7\u00e3o dos Recursos/ });
  assert.equal(await siopeTab.count(), 1, 'SIOPE: aba do módulo deve ser única');
  await siopeTab.click();
  assert.equal(await siopeTab.getAttribute('aria-selected'), 'true', 'SIOPE deve permanecer como aba ativa');

  const siopeIntro = page.getByRole('region', {
    name: 'Aplicação dos Recursos da Educação',
  });
  await siopeIntro.waitFor({ state: 'visible' });

  const siopeHeaderSource = siopeIntro.getByText(SIOPE_SOURCE, { exact: true });
  const siopeMethodNote = siopeIntro.getByText(SIOPE_METHOD_NOTE, { exact: true });
  await siopeHeaderSource.waitFor({ state: 'visible' });
  await siopeMethodNote.waitFor({ state: 'visible' });
  await assertDataSourceLegibility(
    siopeHeaderSource,
    `SIOPE — fonte em ${viewport.width}x${viewport.height}`,
  );
  await assertDataSourceLegibility(
    siopeMethodNote,
    `SIOPE — método em ${viewport.width}x${viewport.height}`,
  );
  assert.equal(await siopeHeaderSource.count(), 1, 'SIOPE: fonte aparece uma vez no cabeçalho');
  assert.equal(await siopeMethodNote.count(), 1, 'SIOPE: metodologia aparece uma vez no cabeçalho');

  const siopeHeaderStructure = await siopeMethodNote.evaluate((element) => ({
    className: element.className,
    firstChildTag: element.firstElementChild?.tagName,
    previousText: element.previousElementSibling?.textContent?.trim(),
    tagName: element.tagName,
    text: element.textContent?.trim(),
  }));

  assert.equal(siopeHeaderStructure.tagName, 'P', 'SIOPE: metodologia preserva o parágrafo discreto');
  assert.equal(siopeHeaderStructure.className, 'data-source-note', 'SIOPE: metodologia reutiliza a gramática de fonte');
  assert.equal(siopeHeaderStructure.firstChildTag, 'STRONG', 'SIOPE: rótulo metodológico é textual');
  assert.equal(siopeHeaderStructure.previousText, SIOPE_SOURCE, 'SIOPE: fonte precede a metodologia');
  assert.equal(siopeHeaderStructure.text, SIOPE_METHOD_NOTE, 'SIOPE: texto metodológico preservado');

  const siopeCard = page.getByRole('button', {
    name: 'Abrir detalhe do indicador Aplicação em MDE',
    exact: true,
  });
  await siopeCard.waitFor({ state: 'visible' });
  await siopeCard.click();
  await page.getByRole('heading', { level: 3, name: 'Aplicação em MDE', exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('heading', { level: 3, name: 'Histórico do indicador', exact: true }).waitFor({ state: 'visible' });

  const siopeSources = page.getByText(SIOPE_SOURCE, { exact: true });
  assert.equal(await siopeSources.count(), 3, 'SIOPE: fonte aparece no cabeçalho, gráfico e tabela');
  assert.deepEqual(
    await siopeSources.allTextContents(),
    [SIOPE_SOURCE, SIOPE_SOURCE, SIOPE_SOURCE],
    'SIOPE: fontes não repetem a metodologia',
  );
  assert.equal(
    await page.getByText(SIOPE_METHOD_NOTE, { exact: true }).count(),
    1,
    'SIOPE: metodologia não se repete no gráfico ou na tabela',
  );

  const siopeTable = page.getByRole('table');
  await siopeTable.waitFor({ state: 'visible' });
  assert.deepEqual(
    await siopeTable.locator('tbody tr').evaluateAll((rows) => rows.map((row) => (
      Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim())
    ))),
    [
      ['2021', '26,7%', 'Com dados'],
      ['2022', '27,4%', 'Com dados'],
      ['2023', '29,0%', 'Com dados'],
      ['2024', '25,3%', 'Com dados'],
      ['2025', '25,5%', 'Com dados'],
    ],
    'SIOPE: valores históricos permanecem inalterados',
  );
  assert.equal(
    await page.getByText(SIOPE_REGISTER_ALERT, { exact: true }).count(),
    0,
    'SIOPE: o alerta de registro não substitui a fonte ou a metodologia quando não há lacuna',
  );

  const fundebTab = moduleTabs.getByRole('tab', { name: /^FUNDEB\b/ });
  assert.equal(await fundebTab.count(), 1, 'FUNDEB: aba do módulo deve ser única');
  await fundebTab.click();
  assert.equal(await fundebTab.getAttribute('aria-selected'), 'true', 'FUNDEB deve permanecer como aba ativa');

  const methodNote = page.getByText(FUNDEB_METHOD_NOTE, { exact: true });
  assert.equal(await methodNote.count(), 0, 'FUNDEB: nota metodológica não aparece fora dos indicadores elegíveis');

  for (const indicator of FUNDEB_METHOD_INDICATORS) {
    const card = page.getByRole('button', { name: indicator.cardName, exact: true });
    await card.waitFor({ state: 'visible' });
    assert.equal(await card.count(), 1, `FUNDEB: card de ${indicator.name} deve ser único`);
    await card.click();

    await page.getByRole('heading', { level: 3, name: indicator.name, exact: true }).waitFor({ state: 'visible' });
    await methodNote.waitFor({ state: 'visible' });
    assert.equal(await methodNote.count(), 1, `FUNDEB: uma nota metodológica para ${indicator.name}`);

    const noteStructure = await methodNote.evaluate((element, sourceText) => {
      const sourceNodes = Array.from(document.querySelectorAll('p'))
        .filter((node) => node.textContent?.trim() === sourceText);

      return {
        className: element.className,
        firstChildTag: element.firstElementChild?.tagName,
        nextText: element.nextElementSibling?.textContent?.trim(),
        sourceAfterNote: sourceNodes.some((sourceNode) => Boolean(
          element.compareDocumentPosition(sourceNode) & Node.DOCUMENT_POSITION_FOLLOWING,
        )),
        tagName: element.tagName,
        text: element.textContent?.trim(),
      };
    }, FUNDEB_SOURCE);

    assert.equal(noteStructure.tagName, 'P', `FUNDEB: nota usa parágrafo para ${indicator.name}`);
    assert.equal(noteStructure.className, 'fundeb-indicator-note', `FUNDEB: classe preservada para ${indicator.name}`);
    assert.equal(noteStructure.firstChildTag, 'STRONG', `FUNDEB: rótulo textual preservado para ${indicator.name}`);
    assert.equal(noteStructure.text, FUNDEB_METHOD_NOTE, `FUNDEB: texto preservado para ${indicator.name}`);
    assert.equal(noteStructure.sourceAfterNote, true, `FUNDEB: fonte sucede a nota para ${indicator.name}`);
    assert.match(noteStructure.nextText ?? '', /Histórico do indicador/, `FUNDEB: histórico sucede a nota para ${indicator.name}`);

    const sourceNotes = page.getByText(FUNDEB_SOURCE, { exact: true });
    assert.ok(await sourceNotes.count() >= 1, `FUNDEB: fonte SIOPE/FNDE preservada para ${indicator.name}`);

    await assertDataSourceLegibility(
      sourceNotes.first(),
      `FUNDEB — ${indicator.name} em ${viewport.width}x${viewport.height}`,
    );

    if (indicator !== FUNDEB_METHOD_INDICATORS[FUNDEB_METHOD_INDICATORS.length - 1]) {
      await siopeTab.click();
      await fundebTab.click();
      assert.equal(await methodNote.count(), 0, 'FUNDEB: troca de módulo restaura o estado sem nota elegível');
    }
  }

  const pnateTab = moduleTabs.getByRole('tab', { name: /^PNATE\b/ });
  assert.equal(await pnateTab.count(), 1, 'PNATE: aba do módulo deve ser única');
  await pnateTab.click();
  assert.equal(await pnateTab.getAttribute('aria-selected'), 'true', 'PNATE deve permanecer como aba ativa');

  const pnateMethodNote = page.getByText(PNATE_METHOD_NOTE, { exact: true });
  await pnateMethodNote.waitFor({ state: 'visible' });
  assert.equal(await pnateMethodNote.count(), 1, 'PNATE: uma nota metodológica é exibida quando há avisos');

  const pnateNoteStructure = await pnateMethodNote.evaluate((element) => ({
    className: element.className,
    firstChildTag: element.firstElementChild?.tagName,
    previousText: element.previousElementSibling?.textContent?.trim(),
    tagName: element.tagName,
    text: element.textContent?.trim(),
  }));

  assert.equal(pnateNoteStructure.tagName, 'P', 'PNATE: nota usa parágrafo');
  assert.equal(pnateNoteStructure.className, 'fundeb-indicator-note', 'PNATE: classe preservada');
  assert.equal(pnateNoteStructure.firstChildTag, 'STRONG', 'PNATE: rótulo textual preservado');
  assert.equal(pnateNoteStructure.text, PNATE_METHOD_NOTE, 'PNATE: texto de avisos[0] preservado');
  assert.match(pnateNoteStructure.previousText ?? '', /Visão geral/, 'PNATE: nota sucede a Visão geral');

  const pnateFinancialAlert = page.getByText(PNATE_FINANCIAL_ALERT, { exact: true });
  assert.equal(await pnateFinancialAlert.count(), 0, 'PNATE: a base de teste não aciona alerta de repasse não autorizado');

  const pnateCard = page.getByRole('button', { name: 'Abrir detalhe do indicador Repasse total', exact: true });
  await pnateCard.waitFor({ state: 'visible' });
  assert.equal(await pnateCard.count(), 1, 'PNATE: card de repasse total deve ser único');
  await pnateCard.click();

  await page.getByRole('heading', { level: 3, name: 'Repasse total', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await pnateMethodNote.count(), 1, 'PNATE: nota metodológica permanece no detalhe');

  const pnateOrder = await pnateMethodNote.evaluate((element, sourceText) => {
    const sourceNodes = Array.from(document.querySelectorAll('p'))
      .filter((node) => node.textContent?.trim() === sourceText);

    return sourceNodes.some((sourceNode) => Boolean(
      element.compareDocumentPosition(sourceNode) & Node.DOCUMENT_POSITION_FOLLOWING,
    ));
  }, PNATE_SOURCE);

  assert.equal(pnateOrder, true, 'PNATE: fonte sucede a nota metodológica');
  const pnateSourceNotes = page.getByText(PNATE_SOURCE, { exact: true });
  assert.ok(await pnateSourceNotes.count() >= 1, 'PNATE: fonte PNATE/FNDE preservada');

  await assertDataSourceLegibility(
    pnateSourceNotes.first(),
    `PNATE em ${viewport.width}x${viewport.height}`,
  );

  await siopeTab.click();
  assert.equal(await siopeTab.getAttribute('aria-selected'), 'true', 'SIOPE: aba pode ser restaurada após o detalhe do PNATE');
  const municipalityInput = page.getByRole('combobox', { name: 'Município' });
  await municipalityInput.fill(SIOPE_2025_MISSING_MUNICIPALITY);
  await page.getByRole('option', { name: SIOPE_2025_MISSING_MUNICIPALITY, exact: true }).click();
  const siopeMunicipalityMissingNote = page.getByText(SIOPE_MUNICIPALITY_2025_MISSING_NOTE, { exact: true });
  await siopeMunicipalityMissingNote.waitFor({ state: 'visible' });
  assert.equal(await siopeMunicipalityMissingNote.count(), 1, 'SIOPE: aviso municipal de ausência de 2025 é preservado');
  assert.equal(
    await page.getByText(SIOPE_REGISTER_ALERT, { exact: true }).count(),
    0,
    'SIOPE: aviso municipal de 2025 permanece distinto do alerta de registro',
  );

  await assertNoHorizontalOverflow(page, `${FINANCE} em ${viewport.width}x${viewport.height}`);
}

async function verifySistemaSFlow(page, viewport) {
  await page.evaluate(async (fixturePath) => {
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    const reactUrl = resources.find((name) => /\/react\.js\?/.test(name));
    const reactDomUrl = resources.find((name) => /\/react-dom_client\.js\?/.test(name));

    if (!reactUrl || !reactDomUrl) {
      throw new Error('Runtime React do Vite não foi localizado para o fixture do Sistema S.');
    }

    const dataResponse = await fetch(fixturePath);
    if (!dataResponse.ok) {
      throw new Error(`Fixture do Sistema S indisponível (${dataResponse.status}).`);
    }

    const [{ SistemaSPanel }, reactModule, reactDomModule, payload] = await Promise.all([
      import('/src/components/SistemaSPanel.jsx'),
      import(reactUrl),
      import(reactDomUrl),
      dataResponse.json(),
    ]);
    const host = document.createElement('div');
    host.id = 'sistema-s-e2e-fixture';
    document.body.replaceChildren(host);
    reactDomModule.default.createRoot(host).render(
      reactModule.default.createElement(SistemaSPanel, { blocos: payload.blocos }),
    );
  }, SISTEMA_S_FIXTURE_PATH);

  const overviewTitle = page.getByRole('heading', { level: 2, name: 'Visão geral', exact: true });
  await overviewTitle.waitFor({ state: 'visible' });

  const sourceNote = page.getByText(SISTEMA_S_SOURCE, { exact: true });
  await sourceNote.waitFor({ state: 'visible' });
  await assertDataSourceLegibility(
    sourceNote,
    `Sistema S em ${viewport.width}x${viewport.height}`,
  );
  assert.equal(await sourceNote.count(), 1, 'Sistema S: fonte oficial aparece uma única vez');

  const overviewStructure = await sourceNote.evaluate((element) => {
    const grid = element.previousElementSibling;
    return {
      metrics: Array.from(grid?.children ?? []).map((card) => (
        Array.from(card.children).map((child) => child.textContent?.trim())
      )),
      previousTagName: grid?.tagName,
      tagName: element.tagName,
    };
  });

  assert.equal(overviewStructure.tagName, 'P', 'Sistema S: fonte preserva o elemento de atribuição');
  assert.equal(overviewStructure.previousTagName, 'DIV', 'Sistema S: fonte sucede a grade da Visão geral');
  assert.deepEqual(
    overviewStructure.metrics,
    [
      ['Escolas', '2', '2025'],
      ['Matrículas', '231', '2025'],
      ['Turmas', '13', '2025'],
      ['Docentes', '12', '2025'],
    ],
    'Sistema S: ano e métricas de Alegrete permanecem inalterados',
  );

  const chartHeading = page.getByText('Histórico do indicador', { exact: true });
  const chart = page.getByRole('img', { name: 'Gráfico de linha', exact: true });
  assert.equal(await chartHeading.count(), 1, 'Sistema S: gráfico permanece presente');
  assert.equal(await chart.count(), 1, 'Sistema S: gráfico mantém alternativa acessível');
  assert.equal(await page.getByText('Distribuição por etapa', { exact: true }).count(), 1, 'Sistema S: distribuição por etapa permanece presente');

  const table = page.getByRole('table');
  await table.waitFor({ state: 'visible' });
  assert.equal(await table.count(), 1, 'Sistema S: tabela de escolas permanece única');
  assert.deepEqual(
    await table.locator('tbody tr').evaluateAll((rows) => rows.map((row) => (
      Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim())
    ))),
    [
      ['Esc Educ Inf do SESC', '74', '4', '4', 'Educação Infantil'],
      ['Servico Nacional de Aprendizagem Comercial', '157', '9', '8', 'Educação Profissional'],
    ],
    'Sistema S: tabela de Alegrete permanece inalterada',
  );

  await assertNoHorizontalOverflow(page, `Sistema S em ${viewport.width}x${viewport.height}`);
}

async function runViewport(browser, viewport, errors) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const viewportLabel = `${viewport.width}x${viewport.height}`;

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`${viewportLabel}: console.error: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    errors.push(`${viewportLabel}: pageerror: ${error.message}`);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
    await assertNoHorizontalOverflow(page, `Home em ${viewportLabel}`);

    await selectMunicipality(page);
    await assertNoHorizontalOverflow(page, `Home com município em ${viewportLabel}`);

    await verifyPne2014Flow(page, viewport);
    await verifyPne2026Flow(page, viewport);
    await verifyEducationFlow(page, viewport);
    await verifyLegalGoalsFlow(page, viewport);
    await verifyFinanceFlow(page, viewport);
    await verifySistemaSFlow(page, viewport);
  } finally {
    await context.close();
  }
}

async function runMobileDataSourceViewport(browser, errors) {
  const context = await browser.newContext({ viewport: MOBILE_DATA_SOURCE_VIEWPORT });
  const page = await context.newPage();
  const viewportLabel = `${MOBILE_DATA_SOURCE_VIEWPORT.width}x${MOBILE_DATA_SOURCE_VIEWPORT.height}`;

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`${viewportLabel}: console.error: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    errors.push(`${viewportLabel}: pageerror: ${error.message}`);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
    await verifySistemaSFlow(page, MOBILE_DATA_SOURCE_VIEWPORT);
  } finally {
    await context.close();
  }
}

function formatLegibilityEvidence() {
  const values = (key) => [...new Set(dataSourceLegibilityEvidence.map((item) => item[key]))];
  const range = (key) => {
    const series = dataSourceLegibilityEvidence.map((item) => item[key]);
    return `${Math.min(...series).toFixed(2)}–${Math.max(...series).toFixed(2)}`;
  };

  return [
    `fontes ${range('fontSize')}px`,
    `cores ${values('color').join(', ')}`,
    `superfícies ${values('background').join(', ')}`,
    `contraste ${range('contrast')}:1`,
    `altura ${range('height')}px`,
    `linhas ${range('lineCount')}`,
  ].join('; ');
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  try {
    for (const viewport of VIEWPORTS) {
      await runViewport(browser, viewport, errors);
    }
    await runMobileDataSourceViewport(browser, errors);

    assert.deepEqual(errors, [], `Erros no navegador:\n${errors.join('\n')}`);
    console.log('E2E flows passed at 1366x768, 1280x720 and 1024x768; DataSourceNote passed at 390x844.');
    console.log(`DataSourceNote legibility: ${formatLegibilityEvidence()}.`);
  } finally {
    await browser.close();
  }
}

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
