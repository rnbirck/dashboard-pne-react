const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const MUNICIPALITY = '\u00c1urea';
const SISTEMA_S_MUNICIPALITY = 'Alegrete';
const PNE_2014 = 'PNE 2014\u20132024';
const PNE_2026 = 'PNE 2026\u20132036';
const EDUCATION = 'Indicadores de Educa\u00e7\u00e3o';
const FINANCE = 'Indicadores Financeiros da Educa\u00e7\u00e3o';
const LEGAL_GOALS = 'Metas legais';
const LEGAL_GOALS_TITLE = 'Metas legais do PNE 2026\u20132036';
const DIAGNOSIS = 'Diagn\u00f3stico municipal';
const EDUCATION_EMPTY = 'Nenhum indicador dispon\u00edvel para este tema ou busca.';
const EDUCATION_EMPTY_SPARKLINE_CARD = 'Abrir detalhe do indicador Matr\u00edculas na rede privada';
const EDUCATION_SCHOOL_STAGE_METHOD = 'Uma mesma escola pode ofertar mais de uma etapa; por isso, a soma por etapa pode ser maior que o total de escolas.';
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
const SISTEMA_S_EMPTY_FIXTURE_PATH = '/data/educacao/municipios/4301552.json';
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
const RESPONSIVE_VIEWPORTS = [
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
];
const MOBILE_DATA_SOURCE_VIEWPORT = { width: 390, height: 844 };
const EDUCATION_CARD_CLASSES = Object.freeze({
  root: 'education-indicator-card',
  statusPrefix: 'education-indicator-card--',
  topline: 'education-indicator-card__topline',
  context: 'education-indicator-card__theme',
  title: 'education-indicator-card__title',
  description: 'education-indicator-card__description',
  valueRow: 'education-indicator-card__value-row',
  support: 'education-indicator-card__support',
  footer: 'education-indicator-card__footer',
  sparkline: Object.freeze({
    root: 'education-indicator-card__sparkline',
    period: 'education-indicator-card__sparkline-period',
    empty: 'education-indicator-card__sparkline--empty',
  }),
});
const FINANCIAL_CARD_CLASSES = Object.freeze({
  root: 'financial-indicator-card',
  statusPrefix: 'financial-indicator-card--',
  topline: 'financial-indicator-card__topline',
  context: 'financial-indicator-card__module',
  title: 'financial-indicator-card__title',
  description: 'financial-indicator-card__description',
  valueRow: 'financial-indicator-card__value-row',
  support: 'financial-indicator-card__support',
  footer: 'financial-indicator-card__footer',
  sparkline: Object.freeze({
    root: 'financial-indicator-card__sparkline',
    period: 'financial-indicator-card__sparkline-period',
    empty: 'financial-indicator-card__sparkline--empty',
  }),
});

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

async function assertPriorityContentInFirstFold(page, viewport) {
  if (viewport.width !== 1024 || viewport.height !== 768) return;
  const evidence = await page.evaluate(() => {
    const municipality = document.querySelector('.context-bar .municipio-selector');
    const heading = document.querySelector('.content-area h1');
    const context = document.querySelector('.context-bar');
    return {
      contextBottom: context?.getBoundingClientRect().bottom,
      headingBottom: heading?.getBoundingClientRect().bottom,
      municipalityBottom: municipality?.getBoundingClientRect().bottom,
      viewportHeight: innerHeight,
    };
  });
  assert.ok(evidence.municipalityBottom <= evidence.viewportHeight, '1024x768: município permanece na primeira dobra');
  assert.ok(evidence.contextBottom <= evidence.viewportHeight, '1024x768: contexto permanece na primeira dobra');
  assert.ok(evidence.headingBottom <= evidence.viewportHeight, '1024x768: h1 permanece na primeira dobra');
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

async function assertAuxiliaryTextLegibility(locator, context) {
  await locator.waitFor({ state: 'visible' });
  const evidence = await locator.evaluate((element) => ({
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    scrollWidth: element.scrollWidth,
    width: element.clientWidth,
  }));

  assert.ok(evidence.fontSize >= 12, `${context}: texto auxiliar deve ter no m\u00ednimo 12 px`);
  assert.ok(evidence.scrollWidth <= evidence.width, `${context}: texto auxiliar n\u00e3o deve causar overflow`);
}

async function selectMunicipality(page, municipality = MUNICIPALITY, waitForTitle = true) {
  const municipalityInput = page.getByRole('combobox', { name: 'Munic\u00edpio' });
  await municipalityInput.fill(municipality);
  await page.getByRole('option', { name: municipality, exact: true }).click();
  await page.getByRole('button', { name: 'Limpar sele\u00e7\u00e3o' }).waitFor({ state: 'visible' });
  if (waitForTitle) {
    await page.getByRole('heading', { level: 1, name: new RegExp(municipality) }).waitFor({ state: 'visible' });
  }
}

function deferDataRequest(page, path) {
  const url = `**${path}`;
  let releaseRequest;
  let resolveRequestStarted;
  let requestStarted = false;
  const requestStartedPromise = new Promise((resolve) => {
    resolveRequestStarted = resolve;
  });
  const requestReleased = new Promise((resolve) => {
    releaseRequest = resolve;
  });
  const handler = async (route) => {
    requestStarted = true;
    resolveRequestStarted();
    await requestReleased;
    await route.continue();
  };

  return {
    async install() {
      await page.route(url, handler);
    },
    release() {
      releaseRequest();
    },
    hasStarted() {
      return requestStarted;
    },
    waitForRequest() {
      return requestStartedPromise;
    },
    async dispose() {
      releaseRequest();
      await page.unroute(url, handler);
    },
  };
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

async function assertExplorableCardGridColumns(grid, viewport, context) {
  await grid.waitFor({ state: 'visible' });
  const columnCount = await grid.evaluate((element) => (
    getComputedStyle(element).gridTemplateColumns
      .split(' ')
      .filter(Boolean)
      .length
  ));
  const expectedColumnCount = viewport.width > 1180 ? 3 : 2;

  assert.equal(
    columnCount,
    expectedColumnCount,
    `${context}: ${expectedColumnCount} colunas em ${viewport.width}x${viewport.height}`,
  );
}

async function assertCardActivationAndFocusRestoration(page, card, cardName, key, context) {
  const indicatorName = cardName.replace('Abrir detalhe do indicador ', '');

  assert.equal(await card.getAttribute('aria-pressed'), 'false', `${context}: card inicia sem seleção`);
  await card.focus();
  await page.keyboard.press(key);
  await page.getByRole('heading', { level: 3, name: indicatorName, exact: true }).waitFor({ state: 'visible' });

  const backToCards = page.getByRole('button', { name: 'Voltar aos indicadores', exact: true }).first();
  await backToCards.waitFor({ state: 'visible' });
  await backToCards.click();
  await card.waitFor({ state: 'visible' });
  await page.waitForFunction(
    (name) => document.activeElement?.getAttribute('aria-label') === name,
    cardName,
  );
  assert.equal(await card.getAttribute('aria-pressed'), 'false', `${context}: card retorna sem seleção`);
}

async function assertControlledAriaPressedTransition(page) {
  const evidence = await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { EducationIndicatorCard } = await import('/src/components/EducationIndicatorCard.jsx');
    const host = document.createElement('div');
    host.className = 'content-area';
    document.body.append(host);
    const root = createRoot(host);
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

    function ControlledCard() {
      const [isSelected, setIsSelected] = React.useState(false);
      return React.createElement(EducationIndicatorCard, {
        indicator: {
          categoryLabel: 'Teste E2E',
          currentDisplay: '1',
          currentYear: 2025,
          description: 'Contrato controlado de seleção.',
          label: 'Contrato aria-pressed UI-15',
          series: [],
          statusLabel: 'Com dados',
          statusTone: 'info',
          variationDisplay: '—',
        },
        isSelected,
        onSelect: () => setIsSelected(true),
      });
    }

    try {
      root.render(React.createElement(ControlledCard));
      await nextFrame();
      await nextFrame();
      const card = host.querySelector('.education-indicator-card');
      const initial = card?.getAttribute('aria-pressed');
      card?.click();
      await nextFrame();
      return {
        initial,
        selected: card?.getAttribute('aria-pressed'),
      };
    } finally {
      root.unmount();
      host.remove();
    }
  });

  assert.deepEqual(
    evidence,
    { initial: 'false', selected: 'true' },
    'UI-15: aria-pressed muda de false para true quando o card controlado é selecionado',
  );
}

async function assertExplorableIndicatorCardStructure(card, { classes, context }) {
  const evidence = await card.evaluate((element) => {
    const regions = Array.from(element.children);
    const sparkline = regions[5];

    return {
      ariaLabel: element.getAttribute('aria-label'),
      ariaPressed: element.getAttribute('aria-pressed'),
      classNames: Array.from(element.classList),
      footerChildren: Array.from(regions[6]?.children ?? []).map((child) => ({
        classNames: Array.from(child.classList),
        tagName: child.tagName,
      })),
      regionClasses: regions.map((region) => Array.from(region.classList)),
      regionTags: regions.map((region) => region.tagName),
      sparkline: {
        ariaHidden: sparkline?.getAttribute('aria-hidden') ?? null,
        childClasses: Array.from(sparkline?.children ?? []).map((child) => Array.from(child.classList)),
        childTags: Array.from(sparkline?.children ?? []).map((child) => child.tagName),
        classNames: Array.from(sparkline?.classList ?? []),
        text: sparkline?.textContent?.trim(),
      },
      title: element.getAttribute('title'),
      type: element.getAttribute('type'),
      valueRowTags: Array.from(regions[3]?.children ?? []).map((child) => child.tagName),
      supportTags: Array.from(regions[4]?.children ?? []).map((child) => child.tagName),
      toplineClasses: Array.from(regions[0]?.children ?? []).map((child) => Array.from(child.classList)),
    };
  });
  const expectedRegionClasses = [
    classes.topline,
    classes.title,
    classes.description,
    classes.valueRow,
    classes.support,
    classes.sparkline.root,
    classes.footer,
  ];

  assert.equal(evidence.type, 'button', `${context}: card preserva type=button`);
  assert.equal(evidence.ariaPressed, 'false', `${context}: card preserva aria-pressed inicial`);
  assert.equal(evidence.title, evidence.ariaLabel.replace('Abrir detalhe do indicador ', ''), `${context}: title preserva o nome do indicador`);
  assert.ok(evidence.ariaLabel.startsWith('Abrir detalhe do indicador '), `${context}: card preserva aria-label`);
  assert.ok(evidence.classNames.includes(classes.root), `${context}: classe raiz espec\u00edfica`);
  assert.ok(evidence.classNames.includes('interaction-card--explorable'), `${context}: classe de intera\u00e7\u00e3o`);
  assert.ok(evidence.classNames.some((className) => className.startsWith(classes.statusPrefix)), `${context}: modificador de status espec\u00edfico`);
  assert.deepEqual(evidence.regionTags, Array(7).fill('SPAN'), `${context}: sete regi\u00f5es diretas em spans`);
  assert.deepEqual(
    evidence.regionClasses.map((classNames) => classNames[0]),
    expectedRegionClasses,
    `${context}: ordem e classes das sete regi\u00f5es`,
  );
  assert.equal(evidence.toplineClasses[0][0], classes.context, `${context}: contexto espec\u00edfico no topline`);
  assert.ok(evidence.toplineClasses[1].includes('status-badge'), `${context}: StatusBadge preservado`);
  assert.deepEqual(evidence.valueRowTags, ['STRONG', 'SPAN'], `${context}: value row preserva a ordem`);
  assert.deepEqual(evidence.supportTags, ['SPAN', 'STRONG'], `${context}: support preserva a ordem`);
  assert.ok(evidence.footerChildren.at(-1).classNames.includes('interaction-chevron'), `${context}: InteractionChevron preservado`);
  assert.equal(evidence.sparkline.ariaHidden, 'true', `${context}: sparkline com hist\u00f3rico permanece oculta para leitores de tela`);
  assert.deepEqual(evidence.sparkline.childTags, ['svg', 'SPAN'], `${context}: sparkline preserva SVG e per\u00edodo`);
  assert.equal(evidence.sparkline.childClasses[1][0], classes.sparkline.period, `${context}: classe do per\u00edodo da sparkline`);
}

async function assertEmptySparklineState(card, { classes, context }) {
  const evidence = await card.evaluate((element) => {
    const sparkline = element.children[5];
    return {
      ariaHidden: sparkline?.getAttribute('aria-hidden') ?? null,
      childElementCount: sparkline?.childElementCount,
      classNames: Array.from(sparkline?.classList ?? []),
      text: sparkline?.textContent?.trim(),
    };
  });

  assert.ok(evidence.classNames.includes(classes.sparkline.root), `${context}: classe raiz da sparkline vazia`);
  assert.ok(evidence.classNames.includes(classes.sparkline.empty), `${context}: estado vazio da sparkline`);
  assert.equal(evidence.childElementCount, 0, `${context}: sparkline vazia n\u00e3o adiciona estrutura`);
  assert.equal(evidence.text, 'Hist\u00f3rico n\u00e3o dispon\u00edvel.', `${context}: texto da sparkline vazia`);
  assert.equal(evidence.ariaHidden, null, `${context}: atributo ARIA da sparkline vazia permanece inalterado`);
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
  const card = await firstExplorableCard(page);
  await assertDataSourceLegibility(
    page.locator('.data-source-note').first(),
    `${PNE_2026} em ${viewport.width}x${viewport.height}`,
  );
  await assertNoHorizontalOverflow(page, `${PNE_2026} em ${viewport.width}x${viewport.height}`);
  await card.click();
  const complementaryTabs = page.getByRole('tablist', { name: 'Opções de exploração' });
  if (await complementaryTabs.count()) {
    const tabs = complementaryTabs.getByRole('tab');
    const panel = page.getByRole('tabpanel').filter({ has: page.locator('.complementary-data__panel-heading') });
    assert.ok(await tabs.count() > 1, 'PNE: conjunto complementar possui abas reais');
    const firstTab = tabs.first();
    const secondTab = tabs.nth(1);
    assert.equal(await firstTab.getAttribute('tabindex'), '0', 'PNE: primeira aba inicia no roving tabindex');
    assert.equal(await secondTab.getAttribute('tabindex'), '-1', 'PNE: aba inativa sai da ordem de Tab');
    await firstTab.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await secondTab.getAttribute('aria-selected'), 'true', 'PNE: ArrowRight ativa a próxima aba');
    assert.equal(await panel.getAttribute('aria-labelledby'), await secondTab.getAttribute('id'), 'PNE: painel referencia a aba ativa');
    await page.keyboard.press('End');
    assert.equal(await tabs.last().getAttribute('aria-selected'), 'true', 'PNE: End ativa a última aba');
    await page.keyboard.press('Home');
    assert.equal(await firstTab.getAttribute('aria-selected'), 'true', 'PNE: Home retorna à primeira aba');
  }
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
  await assertExplorableCardGridColumns(
    page.locator('.education-indicator-card-grid'),
    viewport,
    'Educação: grade de cards',
  );

  const card = await firstExplorableCard(page);
  const cardName = await card.getAttribute('aria-label');
  await assertExplorableIndicatorCardStructure(card, {
    classes: EDUCATION_CARD_CLASSES,
    context: 'Educa\u00e7\u00e3o: card com hist\u00f3rico',
  });
  await assertAuxiliaryTextLegibility(
    card.locator('.education-indicator-card__footer > span').first(),
    `Educa\u00e7\u00e3o em ${viewport.width}x${viewport.height}`,
  );
  const emptySparklineCard = page.getByRole('button', { name: EDUCATION_EMPTY_SPARKLINE_CARD, exact: true });
  assert.equal(await emptySparklineCard.count(), 1, 'Educa\u00e7\u00e3o: card de s\u00e9rie insuficiente deve ser \u00fanico');
  await assertEmptySparklineState(emptySparklineCard, {
    classes: EDUCATION_CARD_CLASSES,
    context: 'Educa\u00e7\u00e3o: card sem hist\u00f3rico',
  });
  await assertControlledAriaPressedTransition(page);
  await assertCardActivationAndFocusRestoration(
    page,
    card,
    cardName,
    'Enter',
    'Educação: ativação por Enter',
  );
  await assertCardActivationAndFocusRestoration(
    page,
    card,
    cardName,
    'Space',
    'Educação: ativação por Espaço',
  );
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
  const schoolsTheme = themes.getByRole('button', { name: 'Escolas 7', exact: true });
  await schoolsTheme.click();
  const totalSchoolsCard = page.getByRole('button', {
    name: 'Abrir detalhe do indicador Total de escolas',
    exact: true,
  });
  await totalSchoolsCard.click();

  const educationSupportPanel = page.locator('.educacao-explore__panel');
  const supportTabs = page.getByRole('tablist', { name: 'Detalhamentos do indicador' });
  const schoolStageTab = supportTabs.getByRole('tab', { name: 'Por etapa', exact: true });
  const schoolNetworkTab = supportTabs.getByRole('tab', { name: 'Por rede', exact: true });
  const supportPanel = page.getByRole('tabpanel').filter({ has: page.locator('.educacao-explore-table, .education-chart') }).first();
  assert.ok(await schoolNetworkTab.getAttribute('id'), 'Educação: aba possui ID único');
  assert.equal(await schoolNetworkTab.getAttribute('aria-controls'), await supportPanel.getAttribute('id'), 'Educação: aba controla o painel');
  await schoolNetworkTab.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await supportTabs.locator('[aria-selected="true"]').count(), 1, 'Educação: ArrowRight mantém uma aba ativa');
  await page.keyboard.press('End');
  assert.equal(await supportTabs.getByRole('tab').last().getAttribute('aria-selected'), 'true', 'Educação: End ativa a última aba');
  await page.keyboard.press('Home');
  assert.equal(await supportTabs.getByRole('tab').first().getAttribute('aria-selected'), 'true', 'Educação: Home ativa a primeira aba');
  await schoolStageTab.click();

  const educationStageSource = educationSupportPanel.getByText(SISTEMA_S_SOURCE, { exact: true });
  const educationStageMethod = educationSupportPanel.getByText(EDUCATION_SCHOOL_STAGE_METHOD, { exact: true });
  await educationStageMethod.waitFor({ state: 'visible' });
  assert.equal(await educationStageSource.count(), 1, 'Educa\u00e7\u00e3o: fonte do recorte por etapa aparece uma vez');
  assert.equal(await educationStageMethod.count(), 1, 'Educa\u00e7\u00e3o: metodologia do recorte por etapa aparece uma vez');

  const educationStageNoteOrder = await educationStageMethod.evaluate((element) => ({
    className: element.className,
    previousClassName: element.previousElementSibling?.className,
    previousText: element.previousElementSibling?.textContent?.trim(),
    tagName: element.tagName,
  }));
  assert.equal(educationStageNoteOrder.tagName, 'P', 'Educa\u00e7\u00e3o: metodologia preserva o par\u00e1grafo');
  assert.equal(educationStageNoteOrder.className, 'educacao-explore__note', 'Educa\u00e7\u00e3o: metodologia preserva a classe');
  assert.equal(educationStageNoteOrder.previousClassName, 'data-source-note', 'Educa\u00e7\u00e3o: fonte precede imediatamente a metodologia');
  assert.equal(educationStageNoteOrder.previousText, SISTEMA_S_SOURCE, 'Educa\u00e7\u00e3o: fonte preserva texto e posi\u00e7\u00e3o');

  await schoolNetworkTab.click();
  assert.equal(await educationStageMethod.count(), 0, 'Educa\u00e7\u00e3o: metodologia n\u00e3o aparece em recorte sem nota');
  assert.equal(await educationSupportPanel.getByText(SISTEMA_S_SOURCE, { exact: true }).count(), 1, 'Educa\u00e7\u00e3o: fonte permanece \u00fanica sem metodologia');

  await page.getByRole('button', { name: 'Voltar aos indicadores', exact: true }).first().click();
  await totalSchoolsCard.waitFor({ state: 'visible' });
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
  const legalIndicator = page.locator('.legal-goal-indicator').first();
  const legalSourceNotes = legalIndicator.locator('.data-source-note');
  await legalSourceNotes.first().waitFor({ state: 'visible' });
  assert.equal(await legalSourceNotes.count(), 2, 'PNE: fonte e metodologia aparecem uma vez no indicador representativo');
  assert.match(await legalSourceNotes.nth(0).innerText(), /^Fonte:/, 'PNE: fonte permanece na primeira posição');
  assert.match(await legalSourceNotes.nth(1).innerText(), /^Nota metodológica:/, 'PNE: metodologia permanece separada e sucede a fonte');
  await assertAuxiliaryTextLegibility(
    page.locator('.legal-goals-results-meta').first(),
    `PNE em ${viewport.width}x${viewport.height}`,
  );
  await assertDataSourceLegibility(
    page.locator('.data-source-note').first(),
    `Metas legais em ${viewport.width}x${viewport.height}`,
  );
  await assertNoHorizontalOverflow(page, `${LEGAL_GOALS} em ${viewport.width}x${viewport.height}`);
}

async function verifyDiagnosisFlow(page, viewport) {
  await page.getByRole('button', { name: DIAGNOSIS, exact: true }).click();
  await page.getByRole('heading', { level: 1, name: new RegExp(MUNICIPALITY) }).waitFor({ state: 'visible' });

  const evidenceBlocks = page.locator('.diagnostic-priorities__source');
  assert.ok(await evidenceBlocks.count() > 0, 'Diagnóstico: prioridades mantêm evidências');
  for (const block of await evidenceBlocks.all()) {
    await block.locator('summary').click();
  }

  const methodologyNotes = evidenceBlocks.getByText(/^Nota metodológica:/);
  assert.ok(await methodologyNotes.count() > 0, 'Diagnóstico: metodologia compatível aparece no bloco de evidência');
  const methodology = methodologyNotes.first();
  const noteOrder = await methodology.evaluate((element) => ({
    previousText: element.previousElementSibling?.textContent?.trim(),
    tagName: element.tagName,
  }));
  assert.equal(noteOrder.tagName, 'P', 'Diagnóstico: MethodNote preserva o parágrafo');
  assert.ok(noteOrder.previousText && !noteOrder.previousText.includes('Nota metodológica:'), 'Diagnóstico: fonte precede a metodologia sem concatenação');
  assert.equal(
    await evidenceBlocks.locator('p').filter({ hasText: /\. Nota metodológica:/ }).count(),
    0,
    'Diagnóstico: fonte e metodologia não ficam duplicadas',
  );
  await assertAuxiliaryTextLegibility(
    evidenceBlocks.first(),
    `Diagnóstico em ${viewport.width}x${viewport.height}`,
  );
  await assertNoHorizontalOverflow(page, `${DIAGNOSIS} em ${viewport.width}x${viewport.height}`);
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
  await assertExplorableCardGridColumns(
    page.locator('.financial-indicator-card-grid'),
    viewport,
    'SIOPE: grade de cards financeiros',
  );
  await assertExplorableIndicatorCardStructure(siopeCard, {
    classes: FINANCIAL_CARD_CLASSES,
    context: 'SIOPE: card com hist\u00f3rico',
  });
  const siopeCardName = await siopeCard.getAttribute('aria-label');
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

  const backToFinancialCards = page.getByRole('button', { name: 'Voltar aos indicadores', exact: true }).first();
  await backToFinancialCards.click();
  await siopeCard.waitFor({ state: 'visible' });
  await page.waitForFunction(
    (name) => document.activeElement?.getAttribute('aria-label') === name,
    siopeCardName,
  );
  assert.equal(await siopeCard.getAttribute('aria-pressed'), 'false', 'SIOPE: card restaurado sem seleção');

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

async function verifySistemaSThemePersistence(page, viewport) {
  const context = `Sistema S enderecavel em ${viewport.width}x${viewport.height}`;
  const sistemaSRequest = deferDataRequest(page, SISTEMA_S_FIXTURE_PATH);
  await sistemaSRequest.install();

  try {
    await page.evaluate((municipality) => {
      localStorage.setItem('pne_dashboard_municipio', municipality);
    }, SISTEMA_S_MUNICIPALITY);
    await page.goto('about:blank');
    await page.goto(`${BASE_URL}#sistemas`, { waitUntil: 'domcontentloaded' });

    const loading = page.getByText('Carregando dados...', { exact: true });
    await loading.waitFor({ state: 'visible' });
    await sistemaSRequest.waitForRequest();
    assert.equal(sistemaSRequest.hasStarted(), true, `${context}: resposta de Sistema S permanece retida`);
    assert.equal(await page.locator('.sistema-s-panel').count(), 0, `${context}: painel aguarda os dados`);
    assert.equal(await page.locator('.education-indicator-card-grid').count(), 0, `${context}: cards do tema padrao nao aparecem durante o carregamento`);

    sistemaSRequest.release();
    const sistemaSPanel = page.locator('.sistema-s-panel');
    await sistemaSPanel.waitFor({ state: 'visible' });
    assert.equal(await sistemaSPanel.count(), 1, `${context}: rota direta preserva o tema Sistema S`);
    assert.equal(await page.locator('.education-indicator-card-grid').count(), 0, `${context}: dados validos nao retornam aos cards do tema padrao`);
    await assertNoHorizontalOverflow(page, context);
  } finally {
    await sistemaSRequest.dispose();
  }

  await navigateTo(page, FINANCE, FINANCE);
  await navigateTo(page, EDUCATION, EDUCATION);
  await page.locator('.sistema-s-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.sistema-s-panel').count(), 1, `${context}: navegacao restaura Sistema S`);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.sistema-s-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.sistema-s-panel').count(), 1, `${context}: recarregamento preserva rota e municipio`);

  const missingSistemaSRequest = deferDataRequest(page, SISTEMA_S_EMPTY_FIXTURE_PATH);
  await missingSistemaSRequest.install();

  try {
    await selectMunicipality(page, MUNICIPALITY, false);
    await page.getByText('Carregando dados...', { exact: true }).waitFor({ state: 'visible' });
    await missingSistemaSRequest.waitForRequest();
    assert.equal(missingSistemaSRequest.hasStarted(), true, `${context}: resposta sem Sistema S permanece retida`);
    assert.equal(await page.locator('.sistema-s-panel').count(), 0, `${context}: troca municipal aguarda a disponibilidade atual`);
    assert.equal(await page.locator('.education-indicator-card-grid').count(), 0, `${context}: troca municipal nao exibe cards do tema padrao antes da resposta`);

    missingSistemaSRequest.release();
    await page.locator('.education-indicator-card-grid').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.sistema-s-panel').count(), 0, `${context}: municipio sem Sistema S usa o fallback apos a resposta`);
    await assertNoHorizontalOverflow(page, `${context} sem dados`);
  } finally {
    await missingSistemaSRequest.dispose();
  }
}

async function verifyAddressableNavigation(page, viewport) {
  const context = `Hash estável em ${viewport.width}x${viewport.height}`;
  await page.goto(`${BASE_URL}/#financeiros?modulo=fundeb`, { waitUntil: 'domcontentloaded' });
  const modules = page.getByRole('tablist', { name: 'Módulos de financiamento da educação' });
  const fundeb = modules.getByRole('tab', { name: /^FUNDEB/ });
  await fundeb.waitFor({ state: 'visible' });
  assert.equal(await fundeb.getAttribute('aria-selected'), 'true', `${context}: módulo financeiro direto`);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await fundeb.waitFor({ state: 'visible' });
  assert.equal(await fundeb.getAttribute('aria-selected'), 'true', `${context}: recarga preserva módulo`);

  const financialModules = [
    { key: 'fundeb', tab: /^FUNDEB/ },
    { key: 'pnate', tab: /^PNATE/ },
    { key: 'siope', tab: /Aplicação dos Recursos/ },
  ];
  for (const module of financialModules) {
    await page.goto(`${BASE_URL}/#financeiros?modulo=${module.key}`, { waitUntil: 'domcontentloaded' });
    const moduleTab = page.getByRole('tablist', { name: 'Módulos de financiamento da educação' }).getByRole('tab', { name: module.tab });
    await moduleTab.waitFor({ state: 'visible' });
    const detailCard = page.getByRole('button', { name: EXPLORABLE_CARD_NAME }).first();
    const cardName = await detailCard.getAttribute('aria-label');
    await detailCard.click();
    assert.match(page.url(), new RegExp(`modulo=${module.key}&detalhe=[^&]+`), `${context}: ${module.key} serializa detalhe`);
    const detailUrl = page.url();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Voltar aos indicadores' }).first().waitFor({ state: 'visible' });
    assert.equal(page.url(), detailUrl, `${context}: ${module.key} preserva detalhe na recarga`);
    await page.getByRole('button', { name: 'Voltar aos indicadores' }).first().click();
    await page.getByRole('button', { name: cardName, exact: true }).waitFor({ state: 'visible' });
    assert.doesNotMatch(page.url(), /detalhe=/, `${context}: ${module.key} remove detalhe ao fechar`);
    await page.goto(`${BASE_URL}/#financeiros?modulo=${module.key}&detalhe=chave-inexistente`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: EXPLORABLE_CARD_NAME }).first().waitFor({ state: 'visible' });
    assert.doesNotMatch(page.url(), /detalhe=/, `${context}: ${module.key} trata chave inválida`);
  }

  await page.goto(`${BASE_URL}/#educacao?tema=rede`, { waitUntil: 'domcontentloaded' });
  const schools = page.getByRole('group', { name: 'Temas da educação' }).getByRole('button', { name: /^Escolas/ });
  await schools.waitFor({ state: 'visible' });
  assert.equal(await schools.getAttribute('aria-pressed'), 'true', `${context}: tema direto`);
  const card = page.getByRole('button', { name: EXPLORABLE_CARD_NAME }).first();
  await card.click();
  assert.match(page.url(), /detalhe=[^&]+/, `${context}: abertura registra detalhe`);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await card.waitFor({ state: 'visible' });
  assert.doesNotMatch(page.url(), /detalhe=/, `${context}: voltar fecha detalhe`);

  await page.goto(`${BASE_URL}/#contexto-invalido`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
  assert.equal(await page.getByRole('button', { name: 'Home', exact: true }).getAttribute('aria-current'), 'page', `${context}: contexto inválido usa Home`);
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

async function verifyMunicipalitySelectorIsolation(page) {
  await page.evaluate(async () => {
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    const reactUrl = resources.find((name) => /\/react\.js\?/.test(name));
    const reactDomUrl = resources.find((name) => /\/react-dom_client\.js\?/.test(name));
    const [{ MunicipalitySelector }, reactModule, reactDomModule] = await Promise.all([
      import('/src/components/MunicipalitySelector.jsx'),
      import(reactUrl),
      import(reactDomUrl),
    ]);
    const host = document.createElement('div');
    host.id = 'municipality-selector-e2e-fixture';
    document.body.replaceChildren(host);
    const selector = (key) => reactModule.default.createElement(MunicipalitySelector, {
      key,
      municipios: ['Alegrete', 'Áurea', 'Bagé'],
      onChange: () => {},
    });
    reactDomModule.default.createRoot(host).render(
      reactModule.default.createElement('div', null, selector('one'), selector('two')),
    );
  });

  const inputs = page.getByRole('combobox', { name: 'Município' });
  await inputs.first().waitFor({ state: 'visible' });
  assert.equal(await inputs.count(), 2, 'Seletor municipal: fixture possui duas instâncias');
  await inputs.nth(0).click();
  await inputs.nth(1).focus();
  const duplicateIds = await page.locator('[id]').evaluateAll((elements) => {
    const ids = elements.map((element) => element.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
  assert.deepEqual(duplicateIds, [], 'Seletor municipal: não existem IDs duplicados entre instâncias');
  for (const input of await inputs.all()) {
    const controls = await input.getAttribute('aria-controls');
    assert.ok(controls, 'Seletor municipal: combobox referencia listbox própria');
    assert.equal(await page.locator(`#${controls}`).count(), 1, 'Seletor municipal: relação aria-controls é única');
  }
}

async function verifyContentStatesFixture(page, viewport) {
  await page.evaluate(async () => {
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    const reactUrl = resources.find((name) => /\/react\.js\?/.test(name));
    const reactDomUrl = resources.find((name) => /\/react-dom_client\.js\?/.test(name));
    const [{ ContentState }, reactModule, reactDomModule] = await Promise.all([
      import('/src/components/ContentState.jsx'), import(reactUrl), import(reactDomUrl),
    ]);
    const host = document.createElement('div');
    document.body.replaceChildren(host);
    const state = (kind, text) => reactModule.default.createElement(ContentState, { kind, key: kind }, text);
    reactDomModule.default.createRoot(host).render(reactModule.default.createElement('div', null,
      state('loading', 'Carregando dados representativos...'),
      state('error', 'Erro representativo ao carregar os dados.'),
      state('empty', 'Sem dados disponíveis.'),
      state('noResults', 'Nenhum resultado para um texto de busca deliberadamente longo.'),
      state('unavailable', 'Valor monetário indisponível: R$ 9.999.999.999.999,99.'),
    ));
  });
  await page.getByRole('alert').waitFor({ state: 'visible' });
  assert.equal(await page.getByRole('alert').count(), 1, 'Estados: erro possui anúncio assertivo');
  assert.equal(await page.getByRole('status').count(), 4, 'Estados: demais naturezas possuem anúncio polido');
  await assertNoHorizontalOverflow(page, `Estados representativos em ${viewport.width}x${viewport.height}`);
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
    await assertPriorityContentInFirstFold(page, viewport);

    await verifyPne2014Flow(page, viewport);
    await verifyPne2026Flow(page, viewport);
    await verifyEducationFlow(page, viewport);
    await verifyLegalGoalsFlow(page, viewport);
    await verifyDiagnosisFlow(page, viewport);
    await verifyFinanceFlow(page, viewport);
    await verifyAddressableNavigation(page, viewport);
    await verifySistemaSThemePersistence(page, viewport);
    await verifyContentStatesFixture(page, viewport);
    await verifyMunicipalitySelectorIsolation(page);
    await verifySistemaSFlow(page, viewport);
  } finally {
    await context.close();
  }
}

async function runResponsiveViewport(browser, viewport, errors) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const viewportLabel = `${viewport.width}x${viewport.height}`;
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${viewportLabel}: console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`${viewportLabel}: pageerror: ${error.message}`));

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
    await selectMunicipality(page);
    await assertNoHorizontalOverflow(page, `Home em ${viewportLabel}`);
    await navigateTo(page, EDUCATION, EDUCATION);
    await page.locator('.education-indicator-card-grid').waitFor({ state: 'visible' });
    await assertNoHorizontalOverflow(page, `Educação em ${viewportLabel}`);
    const columns = await page.locator('.education-indicator-card-grid').evaluate((element) => (
      getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
    ));
    assert.equal(columns, 1, `Educação: uma coluna na grade em ${viewportLabel}`);
    await navigateTo(page, PNE_2026, PNE_2026);
    await assertNoHorizontalOverflow(page, `${PNE_2026} em ${viewportLabel}`);
    if (viewport.width <= 390) {
      const themes = page.getByRole('group', { name: 'Temas' });
      const scrollEvidence = await themes.evaluate((element) => ({
        clientWidth: element.clientWidth,
        overflowX: getComputedStyle(element).overflowX,
        scrollWidth: element.scrollWidth,
      }));
      assert.equal(scrollEvidence.overflowX, 'auto', `${PNE_2026}: rolagem de temas fica contida`);
      assert.ok(scrollEvidence.scrollWidth > scrollEvidence.clientWidth, `${PNE_2026}: conteúdo extenso permanece alcançável`);
    }
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
    for (const viewport of RESPONSIVE_VIEWPORTS) {
      await runResponsiveViewport(browser, viewport, errors);
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
