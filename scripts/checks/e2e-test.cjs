const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const MUNICIPALITY = '\u00c1urea';
const SISTEMA_S_MUNICIPALITY = 'Alegrete';
const PNE_2014 = 'PNE 2014\u20132024';
const PNE_2026 = 'PNE 2026\u20132036';
const EDUCATION = 'Indicadores de Educa\u00e7\u00e3o';
const EDUCATION_DEMAND_TITLE = 'Cenários de atendimento escolar';
const FINANCE = 'Indicadores Financeiros da Educa\u00e7\u00e3o';
const FINANCE_TITLE = 'Como a educa\u00e7\u00e3o municipal \u00e9 financiada';
const LEGAL_GOALS = 'Metas legais';
const LEGAL_GOALS_TITLE = 'Metas legais do PNE 2026\u20132036';
const DIAGNOSIS = 'Diagn\u00f3stico municipal';
const EDUCATION_EMPTY = 'Nenhum indicador encontrado para \u201cconsulta sem resultado\u201d nesta se\u00e7\u00e3o.';
const EDUCATION_DEMAND_NOTE = 'Matr\u00edculas: Censo Escolar da Educa\u00e7\u00e3o B\u00e1sica, INEP. Popula\u00e7\u00e3o hist\u00f3rica: base municipal por idade simples utilizada pelo painel. A p\u00e1gina n\u00e3o mede fila, procura manifesta, vagas ociosas ou d\u00e9ficit de atendimento.';
const EDUCATION_NO_COMPARISON_CARD = /^Abrir detalhe do indicador Matr\u00edculas na rede privada\./;
const EDUCATION_SCHOOL_STAGE_METHOD = 'Uma mesma escola pode ofertar mais de uma etapa; por isso, a soma por etapa pode ser maior que o total de escolas.';
const LEGAL_GOALS_EMPTY = 'Nenhuma meta com acompanhamento municipal compar\u00e1vel encontrada para os filtros selecionados.';
const EXPLORABLE_CARD_NAME = /^Abrir detalhe do indicador /;
const BASIC_EDUCATION_STAGES = 'Etapas da Educa\u00e7\u00e3o B\u00e1sica';
const EDUCATION_HISTORY_CUT = 'Recorte do hist\u00f3rico do indicador';
const WIDE_STAGE_CARD = /^Abrir detalhe do indicador Alunos por turma — Ensino Fundamental\./;
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
const SIDEBAR_GROUP_IDS = Object.freeze(['pne', 'educacao', 'financeiros']);
const EDUCATION_SIDEBAR_ROUTES = Object.freeze([
  { key: 'visao-geral', href: '#educacao?secao=visao-geral', title: EDUCATION },
  { key: 'atendimento', href: '#educacao?secao=atendimento', title: EDUCATION },
  { key: 'trajetoria', href: '#educacao?secao=trajetoria', title: EDUCATION },
  { key: 'profissionais', href: '#educacao?secao=profissionais', title: EDUCATION },
  { key: 'infraestrutura', href: '#educacao?secao=infraestrutura', title: EDUCATION },
  { key: 'modalidades', href: '#educacao?secao=modalidades', title: EDUCATION },
  { key: 'demanda', href: '#educacao?secao=demanda', title: EDUCATION_DEMAND_TITLE },
  { key: 'metodologia', href: '#educacao?secao=metodologia', title: 'Metodologia e fontes' },
]);
const MOBILE_PRIMARY_PAGE_ROUTES = Object.freeze([
  { href: '#home', label: 'Home' },
  { href: '#pne-overview', label: 'VisÃ£o geral do PNE' },
  { href: '#pne2014', label: PNE_2014 },
  { href: '#pne2026', label: PNE_2026 },
  { href: '#pne-legal-goals', label: LEGAL_GOALS },
  { href: '#diagnostico', label: DIAGNOSIS },
  { href: '#financeiros', label: FINANCE },
  { href: '#financeiros-aplicacao-recursos', label: 'SIOPE' },
  { href: '#financeiros-fundeb', label: 'FUNDEB' },
  { href: '#financeiros-vaar', label: 'VAAR' },
  { href: '#financeiros-pnate', label: 'PNATE' },
  ...EDUCATION_SIDEBAR_ROUTES.map(({ href, key }) => ({ href, label: `EducaÃ§Ã£o/${key}` })),
]);
const EDUCATION_CARD_CLASSES = Object.freeze({
  root: 'education-indicator-card',
  statusPrefix: 'education-indicator-card--',
  topline: 'education-indicator-card__topline',
  context: 'education-indicator-card__theme',
  title: 'education-indicator-card__title',
  description: 'education-indicator-card__description',
  valueRow: 'education-indicator-card__value-row',
  metadata: 'education-indicator-card__metadata',
  metadataItem: 'education-indicator-card__metadata-item',
  divider: 'education-indicator-card__divider',
  insight: 'education-indicator-card__insight',
  footer: 'education-indicator-card__footer',
  action: 'education-indicator-card__action',
});
const FINANCIAL_CARD_CLASSES = Object.freeze({
  root: 'financial-indicator-card',
  statusPrefix: 'financial-indicator-card--',
  topline: 'financial-indicator-card__topline',
  context: 'financial-indicator-card__module',
  title: 'financial-indicator-card__title',
  description: 'financial-indicator-card__description',
  valueRow: 'financial-indicator-card__value-row',
  metadata: 'financial-indicator-card__metadata',
  metadataItem: 'financial-indicator-card__metadata-item',
  divider: 'financial-indicator-card__divider',
  insight: 'financial-indicator-card__insight',
  footer: 'financial-indicator-card__footer',
  action: 'financial-indicator-card__action',
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

async function auditPrimaryPagesAtMobile(page, viewport) {
  if (viewport.width !== 390) return;

  for (const route of MOBILE_PRIMARY_PAGE_ROUTES) {
    await page.goto(`${BASE_URL}/${route.href}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' });
    await assertNoHorizontalOverflow(page, `${route.label} em ${viewport.width}x${viewport.height}`);
  }
}

async function assertEffectiveViewport(page, viewport) {
  const effective = await page.evaluate(() => ({
    height: window.innerHeight,
    width: window.innerWidth,
  }));

  assert.equal(
    effective.height,
    viewport.height,
    `Viewport ${viewport.width}x${viewport.height}: altura efetiva inesperada (${effective.height}px)`,
  );

  const acceptedWidths = viewport.width === 1366 ? [1366, 1280] : [viewport.width];
  assert.ok(
    acceptedWidths.includes(effective.width),
    `Viewport ${viewport.width}x${viewport.height}: largura efetiva inesperada (${effective.width}px)`,
  );

  if (viewport.width === 1366) {
    const status = effective.width === 1366
      ? 'real'
      : 'limitada pelo ambiente';
    console.log(`E2E viewport solicitada 1366x768: window.innerWidth=${effective.width} (${status}).`);
  }
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
    await page.getByRole('heading', {
      level: 1,
      name: 'Informação para compreender, acompanhar e planejar a educação municipal',
      exact: true,
    }).waitFor({ state: 'visible' });
    await page.getByRole('complementary', { name: 'Contexto municipal' })
      .getByText(municipality, { exact: true })
      .waitFor({ state: 'visible' });
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
  const navigationTargets = new Map([
    [PNE_2014, '#pne2014'],
    [PNE_2026, '#pne2026'],
    [LEGAL_GOALS, '#pne-legal-goals'],
    [DIAGNOSIS, '#diagnostico'],
    [EDUCATION, '#educacao?secao=visao-geral'],
    [FINANCE, '#financeiros'],
  ]);
  const targetHref = navigationTargets.get(navigationName);
  let navigationControl = targetHref
    ? page.locator(`a[href="${targetHref}"]`).first()
    : page.getByRole('link', { name: navigationName, exact: true }).first();
  if (!(await navigationControl.isVisible().catch(() => false))) {
    const groupName = navigationName.startsWith('PNE') || navigationName === LEGAL_GOALS || navigationName === DIAGNOSIS
      ? 'Plano Nacional de Educação'
      : navigationName === EDUCATION
        ? 'Indicadores educacionais'
        : navigationName === FINANCE
          ? 'Financiamento da educação'
          : null;
    if (groupName) {
      const groupId = groupName === 'Plano Nacional de Educação'
        ? 'pne'
        : groupName === 'Indicadores educacionais'
          ? 'educacao'
          : 'financeiros';
      const groupControl = page.locator(`.nav-group--${groupId} .nav-item--group`);
      await groupControl.evaluate((element) => element.click());
      await page.waitForFunction(
        (selector) => document.querySelector(selector)?.getAttribute('aria-expanded') === 'true',
        `.nav-group--${groupId} .nav-item--group`,
      );
    }
    navigationControl = targetHref
      ? page.locator(`a[href="${targetHref}"]`).first()
      : page.getByRole('link', { name: navigationName, exact: true }).first();
  }
  await navigationControl.evaluate((element) => element.click());
  await waitForPageTitle(page, pageTitle);
}

async function readSidebarState(page) {
  return page.evaluate(() => {
    const groups = {};
    for (const group of document.querySelectorAll('.nav-group')) {
      const groupClass = [...group.classList].find((value) => value.startsWith('nav-group--'));
      const id = groupClass?.replace('nav-group--', '');
      if (!id) continue;

      const button = group.querySelector('.nav-item--group');
      const panel = group.querySelector('.nav-subitems');
      groups[id] = {
        display: panel ? getComputedStyle(panel).display : 'none',
        expanded: button?.getAttribute('aria-expanded'),
        hidden: panel?.hidden ?? true,
      };
    }

    const drawer = document.querySelector('.app-header');
    const menuButton = document.querySelector('.sidebar-menu-button');
    return {
      drawer: {
        ariaHidden: drawer?.getAttribute('aria-hidden') ?? null,
        inert: drawer?.hasAttribute('inert') ?? false,
        open: drawer?.classList.contains('is-drawer-open') ?? false,
      },
      groups,
      menuExpanded: menuButton?.getAttribute('aria-expanded') ?? null,
    };
  });
}

async function assertSidebarState(page, openGroup, context) {
  const state = await readSidebarState(page);
  for (const groupId of SIDEBAR_GROUP_IDS) {
    const group = state.groups[groupId];
    assert.ok(group, `${context}: grupo ${groupId} presente`);
    const isOpen = openGroup === groupId;
    assert.equal(group.expanded, String(isOpen), `${context}: aria-expanded de ${groupId}`);
    assert.equal(group.hidden, !isOpen, `${context}: hidden de ${groupId}`);
    assert.equal(group.display, isOpen ? 'block' : 'none', `${context}: display de ${groupId}`);
  }
}

async function clickSidebarGroup(page, groupId, shouldOpen, context) {
  const selector = `.nav-group--${groupId} .nav-item--group`;
  const control = page.locator(selector);
  assert.equal(await control.count(), 1, `${context}: controle ${groupId} único`);
  await control.evaluate((element) => element.click());
  await page.waitForFunction(
    ({ targetSelector, expected }) => document.querySelector(targetSelector)?.getAttribute('aria-expanded') === expected,
    { targetSelector: selector, expected: shouldOpen ? 'true' : 'false' },
  );
}

async function clickSidebarLink(page, href, pageTitle, context) {
  const link = page.locator(`.top-nav a[href="${href}"]`);
  assert.equal(await link.count(), 1, `${context}: link ${href} único`);
  await link.click();
  await page.waitForFunction((expected) => window.location.hash === expected, href);
  if (pageTitle) await waitForPageTitle(page, pageTitle);
}

async function assertSidebarCurrentLink(page, groupId, href, context) {
  const link = page.locator(`.nav-group--${groupId} a[href="${href}"]`);
  assert.equal(await link.count(), 1, `${context}: item corrente ${href} único`);
  await page.waitForFunction(
    ({ targetGroupId, targetHref }) => document.querySelector(`.nav-group--${targetGroupId} a[aria-current="page"]`)?.getAttribute('href') === targetHref,
    { targetGroupId: groupId, targetHref: href },
  );
  assert.equal(await link.getAttribute('aria-current'), 'page', `${context}: aria-current em ${href}`);
  assert.ok(
    (await link.getAttribute('class'))?.includes('is-active'),
    `${context}: classe ativa em ${href}`,
  );
}

async function assertSidebarVerticalLayout(page, groupId, context) {
  const layout = await page.evaluate((targetGroupId) => {
    const sidebar = document.querySelector('.app-header');
    const navigation = document.querySelector('.top-nav');
    const group = document.querySelector(`.nav-group--${targetGroupId}`);
    const button = group?.querySelector(':scope > .nav-item--group');
    const submenu = group?.querySelector(':scope > .nav-subitems');
    const submenuList = submenu?.querySelector(':scope > ul');
    const links = submenu ? [...submenu.querySelectorAll(':scope a')] : [];
    const directGroups = navigation ? [...navigation.querySelectorAll(':scope > .nav-group')] : [];
    const rectOf = (node) => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    const styleOf = (node, properties) => {
      if (!node) return null;
      const style = getComputedStyle(node);
      return Object.fromEntries(properties.map((property) => [property, style[property]]));
    };
    const flowProperties = [
      'display',
      'flexDirection',
      'flexWrap',
      'gridAutoFlow',
      'position',
      'left',
      'right',
      'transform',
      'width',
      'minWidth',
      'flexBasis',
      'whiteSpace',
      'overflowX',
      'overflowY',
    ];
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      sidebar: { rect: rectOf(sidebar), styles: styleOf(sidebar, flowProperties) },
      navigation: {
        rect: rectOf(navigation),
        styles: styleOf(navigation, flowProperties),
        clientWidth: navigation?.clientWidth ?? null,
        scrollWidth: navigation?.scrollWidth ?? null,
        scrollLeft: navigation?.scrollLeft ?? null,
      },
      group: { rect: rectOf(group), styles: styleOf(group, flowProperties) },
      button: { rect: rectOf(button), styles: styleOf(button, flowProperties) },
      submenu: { rect: rectOf(submenu), styles: styleOf(submenu, flowProperties) },
      submenuList: { rect: rectOf(submenuList), styles: styleOf(submenuList, flowProperties) },
      firstItem: { rect: rectOf(links[0]), styles: styleOf(links[0], flowProperties) },
      lastItem: { rect: rectOf(links.at(-1)), styles: styleOf(links.at(-1), flowProperties) },
      directGroups: directGroups.map((node) => rectOf(node)),
      body: { clientWidth: document.body.clientWidth, scrollWidth: document.body.scrollWidth },
    };
  }, groupId);

  const tolerance = 1.5;
  assert.ok(layout.sidebar.rect, `${context}: sidebar encontrada`);
  assert.ok(layout.navigation.rect, `${context}: área rolável encontrada`);
  assert.ok(layout.group.rect, `${context}: grupo ${groupId} encontrado`);
  assert.ok(layout.submenu.rect, `${context}: submenu encontrado`);
  assert.ok(
    ['flex', 'block'].includes(layout.navigation.styles.display),
    `${context}: navegação mantém um modo de fluxo vertical válido`,
  );
  if (layout.navigation.styles.display === 'flex') {
    assert.equal(layout.navigation.styles.flexDirection, 'column', `${context}: navegação vertical`);
    assert.equal(layout.navigation.styles.flexWrap, 'nowrap', `${context}: navegação não cria colunas`);
  }
  assert.equal(layout.navigation.styles.overflowX, 'hidden', `${context}: navegação sem overflow horizontal`);
  assert.equal(layout.group.styles.flexBasis, 'auto', `${context}: grupo mantém flex-basis natural`);
  assert.equal(layout.group.styles.minWidth, '0px', `${context}: grupo aceita min-width 0`);
  assert.equal(layout.group.styles.position, 'relative', `${context}: grupo permanece no fluxo`);
  assert.equal(layout.submenu.styles.position, 'static', `${context}: submenu em fluxo estático`);
  assert.equal(layout.submenu.styles.left, 'auto', `${context}: submenu sem left lateral`);
  assert.equal(layout.submenu.styles.right, 'auto', `${context}: submenu sem right lateral`);
  assert.equal(layout.submenu.styles.transform, 'none', `${context}: submenu sem transform lateral`);
  assert.equal(layout.submenuList.styles.gridAutoFlow, 'row', `${context}: itens do submenu em fluxo vertical`);
  assert.ok(
    layout.submenu.rect.right <= layout.navigation.rect.right + tolerance,
    `${context}: submenu cabe na largura da navegação`,
  );
  assert.ok(
    layout.submenu.rect.left >= layout.navigation.rect.left - tolerance,
    `${context}: submenu não sai pela esquerda`,
  );
  assert.ok(
    layout.navigation.scrollWidth <= layout.navigation.clientWidth + tolerance,
    `${context}: scrollWidth da navegação não excede a largura visível`,
  );
  assert.ok(
    layout.body.scrollWidth <= layout.body.clientWidth + tolerance,
    `${context}: documento não cria rolagem horizontal`,
  );
  assert.ok(
    layout.directGroups.every((rect) => rect.left >= layout.navigation.rect.left - tolerance),
    `${context}: grupos permanecem dentro da navegação`,
  );
  const groupLefts = layout.directGroups.map((rect) => rect.left);
  assert.ok(
    Math.max(...groupLefts) - Math.min(...groupLefts) <= tolerance,
    `${context}: grupos mantêm o mesmo eixo vertical`,
  );
  assert.ok(
    layout.firstItem.rect.top < layout.lastItem.rect.top,
    `${context}: primeiro e último item seguem para baixo`,
  );
}

async function verifySidebarDesktopFlow(page, viewport) {
  const context = `Sidebar desktop ${viewport.width}x${viewport.height}`;
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
  await assertSidebarState(page, null, `${context}: inicial`);

  const educationControl = page.locator('.nav-group--educacao .nav-item--group');
  await clickSidebarGroup(page, 'educacao', true, context);
  await assertSidebarState(page, 'educacao', `${context}: abertura`);
  await assertSidebarVerticalLayout(page, 'educacao', `${context}: abertura`);

  await educationControl.press('Enter');
  await assertSidebarState(page, null, `${context}: Enter fecha somente educação`);
  assert.equal(
    await page.evaluate(() => document.activeElement?.matches('.nav-group--educacao .nav-item--group')),
    true,
    `${context}: foco permanece no controle após Enter`,
  );
  await educationControl.press('Space');
  await assertSidebarState(page, 'educacao', `${context}: Espaço reabre educação`);

  for (const route of EDUCATION_SIDEBAR_ROUTES) {
    await clickSidebarLink(page, route.href, route.title, `${context}: rota ${route.key}`);
    await assertSidebarState(page, 'educacao', `${context}: rota ${route.key}`);
    await assertSidebarCurrentLink(page, 'educacao', route.href, `${context}: rota ${route.key}`);
  }

  const reloadRoute = EDUCATION_SIDEBAR_ROUTES.at(-1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForPageTitle(page, reloadRoute.title);
  await assertSidebarState(page, 'educacao', `${context}: reload ${reloadRoute.key}`);
  await assertSidebarCurrentLink(page, 'educacao', reloadRoute.href, `${context}: reload ${reloadRoute.key}`);

  const backRoute = EDUCATION_SIDEBAR_ROUTES[0];
  const forwardRoute = EDUCATION_SIDEBAR_ROUTES[2];
  await clickSidebarLink(page, backRoute.href, EDUCATION, `${context}: prepara Back`);
  await clickSidebarLink(page, forwardRoute.href, EDUCATION, `${context}: prepara Forward`);
  await page.goBack();
  await page.waitForFunction((expected) => window.location.hash === expected, backRoute.href);
  await waitForPageTitle(page, EDUCATION);
  await assertSidebarState(page, 'educacao', `${context}: Back`);
  await assertSidebarCurrentLink(page, 'educacao', backRoute.href, `${context}: Back`);
  await page.goForward();
  await page.waitForFunction((expected) => window.location.hash === expected, forwardRoute.href);
  await waitForPageTitle(page, EDUCATION);
  await assertSidebarState(page, 'educacao', `${context}: Forward`);
  await assertSidebarCurrentLink(page, 'educacao', forwardRoute.href, `${context}: Forward`);

  await clickSidebarGroup(page, 'pne', true, context);
  await assertSidebarState(page, 'pne', `${context}: alternância para PNE`);
  await clickSidebarLink(page, '#pne-overview', null, `${context}: rota PNE`);
  await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
  await assertSidebarState(page, 'pne', `${context}: PNE ativo`);
  await assertSidebarCurrentLink(page, 'pne', '#pne-overview', `${context}: PNE ativo`);

  await clickSidebarGroup(page, 'educacao', true, context);
  await assertSidebarState(page, 'educacao', `${context}: volta para educação`);
  await clickSidebarLink(page, EDUCATION_SIDEBAR_ROUTES[0].href, EDUCATION, `${context}: educação após PNE`);

  await clickSidebarGroup(page, 'financeiros', true, context);
  await assertSidebarState(page, 'financeiros', `${context}: alternância para financiamento`);
  await assertSidebarVerticalLayout(page, 'financeiros', `${context}: alternância para financiamento`);
  await clickSidebarLink(page, '#financeiros', FINANCE_TITLE, `${context}: financiamento ativo`);
  await assertSidebarState(page, 'financeiros', `${context}: financiamento após navegação`);
  await assertSidebarCurrentLink(page, 'financeiros', '#financeiros', `${context}: financiamento ativo`);

  await page.goto(`${BASE_URL}/${EDUCATION_SIDEBAR_ROUTES[0].href}`, { waitUntil: 'domcontentloaded' });
  await waitForPageTitle(page, EDUCATION);
  await assertSidebarState(page, 'educacao', `${context}: URL direta`);
  await assertSidebarCurrentLink(page, 'educacao', EDUCATION_SIDEBAR_ROUTES[0].href, `${context}: URL direta`);
}

async function verifySidebarMobileDrawerFlow(page, viewport) {
  const context = `Sidebar drawer ${viewport.width}x${viewport.height}`;
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });

  const menuButton = page.locator('.sidebar-menu-button');
  assert.equal(await menuButton.count(), 1, `${context}: botão Menu único`);
  assert.equal(await menuButton.getAttribute('aria-expanded'), 'false', `${context}: drawer começa fechado`);
  await assertSidebarState(page, null, `${context}: inicial`);
  let state = await readSidebarState(page);
  assert.equal(state.drawer.ariaHidden, 'true', `${context}: drawer fechado usa aria-hidden`);
  assert.equal(state.drawer.inert, true, `${context}: drawer fechado usa inert`);

  await menuButton.click();
  await page.waitForFunction(() => document.querySelector('.sidebar-menu-button')?.getAttribute('aria-expanded') === 'true');
  state = await readSidebarState(page);
  assert.equal(state.drawer.open, true, `${context}: drawer abre`);
  assert.equal(state.drawer.ariaHidden, null, `${context}: drawer aberto fica exposto`);
  assert.equal(state.drawer.inert, false, `${context}: drawer aberto fica interativo`);
  await assertSidebarState(page, null, `${context}: grupos recolhidos no Home`);

  await clickSidebarGroup(page, 'educacao', true, context);
  await assertSidebarState(page, 'educacao', `${context}: abertura do grupo`);
  await assertSidebarVerticalLayout(page, 'educacao', `${context}: abertura do grupo`);
  const selectedRoute = EDUCATION_SIDEBAR_ROUTES[1];
  await clickSidebarLink(page, selectedRoute.href, selectedRoute.title, `${context}: item do submenu`);
  state = await readSidebarState(page);
  assert.equal(state.menuExpanded, 'false', `${context}: navegação fecha o drawer`);
  assert.equal(state.drawer.ariaHidden, 'true', `${context}: drawer fechado após navegação`);
  assert.equal(state.drawer.inert, true, `${context}: drawer inerte após navegação`);
  await assertSidebarState(page, 'educacao', `${context}: grupo preservado após navegação`);
  await assertSidebarCurrentLink(page, 'educacao', selectedRoute.href, `${context}: item selecionado`);

  await menuButton.click();
  await page.waitForFunction(() => document.querySelector('.sidebar-menu-button')?.getAttribute('aria-expanded') === 'true');
  await assertSidebarState(page, 'educacao', `${context}: reabertura preserva grupo`);

  const closeButton = page.locator('.sidebar-close-button');
  await closeButton.waitFor({ state: 'visible' });
  await closeButton.press('Escape');
  await page.waitForFunction(() => document.querySelector('.sidebar-menu-button')?.getAttribute('aria-expanded') === 'false');
  await page.waitForFunction(() => document.activeElement?.matches('.sidebar-menu-button'));
  assert.equal(
    await page.evaluate(() => document.activeElement?.matches('.sidebar-menu-button')),
    true,
    `${context}: Escape devolve foco ao botão Menu`,
  );

  const directRoute = EDUCATION_SIDEBAR_ROUTES.at(-1);
  await page.goto(`${BASE_URL}/${directRoute.href}`, { waitUntil: 'domcontentloaded' });
  await waitForPageTitle(page, directRoute.title);
  await assertSidebarState(page, 'educacao', `${context}: URL direta/reload`);
  await assertSidebarCurrentLink(page, 'educacao', directRoute.href, `${context}: URL direta/reload`);

  await menuButton.click();
  await page.waitForFunction(() => document.querySelector('.sidebar-menu-button')?.getAttribute('aria-expanded') === 'true');
  await clickSidebarGroup(page, 'pne', true, context);
  await assertSidebarState(page, 'pne', `${context}: alternância para PNE`);
  await clickSidebarGroup(page, 'financeiros', true, context);
  await assertSidebarState(page, 'financeiros', `${context}: alternância para financiamento`);
  await clickSidebarGroup(page, 'educacao', true, context);
  await assertSidebarState(page, 'educacao', `${context}: retorno para educação`);
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
  const expectedColumnCount = viewport.width > 1180 ? 3 : viewport.width > 700 ? 2 : 1;

  assert.equal(
    columnCount,
    expectedColumnCount,
    `${context}: ${expectedColumnCount} colunas em ${viewport.width}x${viewport.height}`,
  );
}

async function assertCardActivationAndFocusRestoration(page, card, cardName, key, context) {
  const indicatorName = await card.getAttribute('title');

  assert.equal(await card.getAttribute('aria-pressed'), 'false', `${context}: card inicia sem seleção`);
  await card.focus();
  await page.keyboard.press(key);
  await page.getByRole('heading', { level: 1, name: indicatorName, exact: true }).waitFor({ state: 'visible' });

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

    const renderCard = (isSelected) => React.createElement(EducationIndicatorCard, {
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
        onSelect: () => {},
      });

    try {
      root.render(renderCard(false));
      let card = null;
      for (let attempt = 0; attempt < 20 && !card; attempt += 1) {
        await nextFrame();
        card = host.querySelector('.education-indicator-card');
      }
      const initial = card?.getAttribute('aria-pressed');
      root.render(renderCard(true));
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
  if (classes.root === 'financial-indicator-card') {
    const evidence = await card.evaluate((element) => ({
      actionChildren: Array.from(element.querySelector('.financial-indicator-card__action')?.children ?? []).map((child) => Array.from(child.classList)),
      actionText: element.querySelector('.financial-indicator-card__action')?.textContent?.trim(),
      ariaLabel: element.getAttribute('aria-label'),
      ariaPressed: element.getAttribute('aria-pressed'),
      classNames: Array.from(element.classList),
      hasSparkline: Boolean(element.querySelector('[class*="sparkline"]')),
      insightText: element.querySelector('.financial-indicator-card__insight')?.textContent?.trim(),
      metadataLabels: Array.from(element.querySelectorAll('.financial-indicator-card__metadata-label')).map((node) => node.textContent?.trim()),
      regionClasses: Array.from(element.children).map((region) => Array.from(region.classList)[0]),
      regionTags: Array.from(element.children).map((region) => region.tagName),
      title: element.getAttribute('title'),
      type: element.getAttribute('type'),
      valueRowTags: Array.from(element.querySelector('.financial-indicator-card__value-row')?.children ?? []).map((child) => child.tagName),
      visibleTitle: element.querySelector('.financial-indicator-card__title')?.textContent?.trim(),
    }));
    const expectedRegionClasses = [
      classes.topline,
      classes.title,
      classes.description,
      classes.valueRow,
      classes.metadata,
      classes.divider,
      classes.insight,
      classes.footer,
    ];

    assert.equal(evidence.type, 'button', `${context}: card preserva type=button`);
    assert.equal(evidence.ariaPressed, 'false', `${context}: card preserva aria-pressed inicial`);
    assert.equal(evidence.title, evidence.visibleTitle, `${context}: title preserva o nome visível do indicador`);
    assert.ok(evidence.ariaLabel.startsWith('Abrir detalhe do indicador '), `${context}: card preserva aria-label`);
    assert.ok(evidence.classNames.includes(classes.root), `${context}: classe raiz específica`);
    assert.ok(evidence.classNames.includes('indicator-card-shell--financial'), `${context}: anatomia editorial de Financiamento`);
    assert.ok(evidence.classNames.includes('interaction-card--explorable'), `${context}: classe de interação`);
    assert.deepEqual(evidence.regionTags, Array(8).fill('SPAN'), `${context}: oito regiões diretas em spans`);
    assert.deepEqual(evidence.regionClasses, expectedRegionClasses, `${context}: ordem e classes das oito regiões`);
    assert.ok(evidence.metadataLabels.includes('Ano'), `${context}: rótulo Ano permanece no bloco de metadados`);
    assert.deepEqual(evidence.valueRowTags.slice(0, 1), ['STRONG'], `${context}: valor principal usa strong`);
    assert.match(evidence.insightText, /Leitura/, `${context}: bloco secundário preserva Leitura`);
    assert.equal(evidence.actionText, '', `${context}: ação visual permanece reduzida ao chevron`);
    assert.ok(evidence.actionChildren.at(-1).includes('interaction-chevron'), `${context}: InteractionChevron preservado`);
    assert.equal(evidence.hasSparkline, false, `${context}: card financeiro não renderiza sparkline`);
    return;
  }

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
      visibleTitle: regions[1]?.textContent?.trim(),
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
  assert.equal(evidence.title, evidence.visibleTitle, `${context}: title preserva o nome visÃ­vel do indicador`);
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

async function assertEducationIndicatorCardStructure(card, { classes, context }) {
  const evidence = await card.evaluate((element) => {
    const regions = Array.from(element.children);
    const footer = element.querySelector('.education-indicator-card__footer');
    const action = element.querySelector('.education-indicator-card__action');
    const metadata = element.querySelector('.education-indicator-card__metadata');
    const insight = element.querySelector('.education-indicator-card__insight');

    return {
      actionChildren: Array.from(action?.children ?? []).map((child) => Array.from(child.classList)),
      actionText: action?.textContent?.trim(),
      ariaLabel: element.getAttribute('aria-label'),
      ariaPressed: element.getAttribute('aria-pressed'),
      classNames: Array.from(element.classList),
      footerChildren: Array.from(footer?.children ?? []).map((child) => Array.from(child.classList)),
      hasHistoryCopy: (element.textContent ?? '').includes('Histórico não disponível'),
      hasSparkline: Boolean(element.querySelector('[class*="sparkline"]')),
      insightText: insight?.textContent?.trim(),
      metadataLabels: Array.from(metadata?.querySelectorAll('.education-indicator-card__metadata-label') ?? []).map((node) => node.textContent?.trim()),
      metadataItemCount: metadata?.querySelectorAll('.education-indicator-card__metadata-item').length ?? 0,
      regionClasses: regions.map((region) => Array.from(region.classList)),
      regionTags: regions.map((region) => region.tagName),
      title: element.getAttribute('title'),
      type: element.getAttribute('type'),
      valueRowTags: Array.from(element.querySelector('.education-indicator-card__value-row')?.children ?? []).map((child) => child.tagName),
      visibleTitle: element.querySelector('.education-indicator-card__title')?.textContent?.trim(),
    };
  });
  const expectedRegionClasses = [
    classes.topline,
    classes.title,
    classes.description,
    classes.valueRow,
    classes.metadata,
    classes.divider,
    classes.insight,
    classes.footer,
  ];

  assert.equal(evidence.type, 'button', `${context}: card preserva type=button`);
  assert.equal(evidence.ariaPressed, 'false', `${context}: card preserva aria-pressed inicial`);
  assert.equal(evidence.title, evidence.visibleTitle, `${context}: title preserva o nome visível do indicador`);
  assert.ok(evidence.ariaLabel.startsWith('Abrir detalhe do indicador '), `${context}: card preserva aria-label`);
  assert.ok(evidence.classNames.includes(classes.root), `${context}: classe raiz específica`);
  assert.ok(evidence.classNames.includes('indicator-card-shell--education'), `${context}: anatomia editorial de Educação`);
  assert.ok(evidence.classNames.includes('interaction-card--explorable'), `${context}: classe de interação`);
  assert.ok(evidence.classNames.some((className) => className.startsWith(classes.statusPrefix)), `${context}: modificador de status específico`);
  assert.deepEqual(evidence.regionTags, Array(8).fill('SPAN'), `${context}: oito regiões diretas em spans`);
  assert.deepEqual(
    evidence.regionClasses.map((classNames) => classNames[0]),
    expectedRegionClasses,
    `${context}: ordem e classes das oito regiões`,
  );
  assert.ok(evidence.metadataItemCount >= 1, `${context}: ano permanece no bloco de metadados`);
  assert.ok(evidence.metadataLabels.includes('Ano'), `${context}: rótulo Ano permanece no bloco de metadados`);
  assert.deepEqual(evidence.valueRowTags.slice(0, 1), ['STRONG'], `${context}: valor principal usa strong`);
  assert.match(evidence.insightText, /Leitura/, `${context}: bloco secundário preserva Leitura`);
  assert.equal(evidence.actionText, '', `${context}: ação visual permanece reduzida ao chevron`);
  assert.ok(evidence.actionChildren.at(-1).includes('interaction-chevron'), `${context}: InteractionChevron preservado`);
  assert.equal(evidence.hasSparkline, false, `${context}: card de Educação não renderiza sparkline`);
  assert.equal(evidence.hasHistoryCopy, false, `${context}: card de Educação não renderiza mensagem de histórico`);
}

async function assertEducationCardWithoutComparison(card, context) {
  const evidence = await card.evaluate((element) => ({
    hasSparkline: Boolean(element.querySelector('[class*="sparkline"]')),
    insightText: element.querySelector('.education-indicator-card__insight')?.textContent?.trim() ?? '',
    metadataLabels: Array.from(element.querySelectorAll('.education-indicator-card__metadata-label')).map((node) => node.textContent?.trim()),
    periodCount: element.querySelectorAll('.education-indicator-card__insight-item').length,
    text: element.textContent ?? '',
  }));

  assert.equal(evidence.hasSparkline, false, `${context}: card sem comparação não recebe área de gráfico`);
  assert.equal(evidence.metadataLabels.some((label) => label?.startsWith('Variação')), false, `${context}: variação ausente sem série comparável`);
  assert.equal(evidence.periodCount, 1, `${context}: período de comparação oculto para série insuficiente`);
  assert.match(evidence.insightText, /Série disponível|Leitura recente indisponível/, `${context}: leitura sem comparação é contextual`);
  assert.equal(evidence.text.includes('Histórico não disponível'), false, `${context}: mensagem de histórico removida`);
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

  const closedCards = page.locator('.meta-card--closed-cycle');
  await closedCards.first().waitFor({ state: 'visible' });
  const closedCardEvidence = await closedCards.evaluateAll((elements) => elements.map((element) => ({
    hasHistory: /histórico não disponível|histórico/i.test(element.textContent ?? ''),
    hasReading: Boolean(element.querySelector('.meta-card__reading')),
    hasSparkline: Boolean(element.querySelector('.meta-card__sparkline')),
    metricCount: element.querySelectorAll('.meta-card__metric').length,
    referenceCount: element.querySelectorAll('.meta-card__state-reference').length,
  })));
  assert.ok(
    closedCardEvidence.every(({ hasHistory, hasReading, hasSparkline, metricCount }) => (
      !hasHistory && !hasReading && !hasSparkline && metricCount === 3
    )),
    `${PNE_2014}: cards encerrados exibem somente as três métricas, barra e rodapé`,
  );
  assert.ok(
    closedCardEvidence.some(({ referenceCount }) => referenceCount === 1),
    `${PNE_2014}: ao menos um indicador comparável exibe Referência RS`,
  );
  const closedValueColumns = await closedCards.first().locator('.meta-card__value-row').evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
  );
  assert.equal(
    closedValueColumns,
    viewport.width <= 680 ? 2 : 3,
    `${PNE_2014}: bloco municipal/meta/distância usa ${viewport.width <= 680 ? 2 : 3} colunas`,
  );

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
  const stages = page.getByRole('group', { name: BASIC_EDUCATION_STAGES });
  const allStagesOption = stages.getByRole('button', { name: 'Todos', exact: true });
  if (await allStagesOption.getAttribute('aria-pressed') !== 'true') {
    await allStagesOption.click();
  }
  const card = await firstExplorableCard(page);
  const trendCards = page.locator('.meta-card--next-cycle.meta-card--has-trend');
  const cardsWithoutTrend = page.locator('.meta-card--next-cycle:not(.meta-card--has-trend)');
  await trendCards.first().waitFor({ state: 'visible' });
  await cardsWithoutTrend.first().waitFor({ state: 'visible' });
  const trendCard = trendCards.first();
  const trendAriaLabel = await trendCard.getAttribute('aria-label');
  assert.match(
    trendAriaLabel,
    /Tendência: (alta|estável|queda), de \d{4} a \d{4}\./i,
    `${PNE_2026}: o aria-label inclui a tendência e o intervalo observado`,
  );
  assert.equal(
    await trendCard.locator('.meta-card__metric--trend').count(),
    1,
    `${PNE_2026}: tendência disponível ocupa uma métrica`,
  );
  assert.equal(
    await trendCard.locator('.meta-card__trend-icon[aria-hidden="true"]').count(),
    1,
    `${PNE_2026}: seta é decorativa para leitores de tela`,
  );
  assert.doesNotMatch(
    await trendCard.innerText(),
    /slope|threshold|consistency|p\.p\.\/ano|inclinação|taxa/i,
    `${PNE_2026}: auditoria não aparece no card`,
  );
  await assertTrendAndReferenceIndependence(page);
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

async function assertTrendAndReferenceIndependence(page) {
  const evidence = await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { MetaCard } = await import('/src/components/MetaCard.jsx');
    const host = document.createElement('div');
    host.className = 'content-area';
    document.body.append(host);
    const root = createRoot(host);
    const item = {
      key: 'trend-independence-fixture',
      label: 'Indicador de independência',
      value_mode: 'percent',
    };
    const baseResult = {
      available: true,
      end_value: 50,
      end_year: 2025,
      meta: 60,
      distance: -10,
      direction: 'at_least',
      atingida: false,
      display: {
        distance: '-10,0 p.p.',
        end_value: '50,0%',
        interpretation: 'Fixture',
        start_value: '40,0%',
        status: 'Meta não atingida',
        variation: 'Alta de 10,0 p.p.',
      },
      series: [
        { ano: 2021, valor: 40 },
        { ano: 2022, valor: 42 },
        { ano: 2023, valor: 44 },
        { ano: 2024, valor: 47 },
        { ano: 2025, valor: 50 },
      ],
    };
    const reference = {
      indicators: {
        'trend-independence-fixture': {
          comparison_status: 'comparable',
          series: [{ comparison_status: 'comparable', value: 48, year: 2025 }],
        },
      },
    };
    const trend = {
      consistency: 1,
      end_year: 2025,
      label: 'Alta',
      method: 'theil_sen_v1',
      observations: 5,
      slope: 2.5,
      start_year: 2021,
      status: 'up',
      threshold: 0.5,
      unavailable_reason: null,
    };

    root.render(React.createElement('div', null,
      React.createElement(MetaCard, {
        cycle: 'pne_2026_2036',
        item,
        onSelect: () => {},
        result: { ...baseResult, trend },
        stateReference: null,
      }),
      React.createElement(MetaCard, {
        cycle: 'pne_2026_2036',
        item,
        onSelect: () => {},
        result: baseResult,
        stateReference: reference,
      }),
      React.createElement(MetaCard, {
        cycle: 'pne_2014_2024',
        item,
        onSelect: () => {},
        result: {
          ...baseResult,
          end_value: 23,
          end_year: 2024,
          meta: 50,
          distance: -27,
          display: {
            ...baseResult.display,
            distance: '-27,0 p.p.',
            end_value: '23,0%',
          },
        },
        stateReference: {
          indicators: {
            'trend-independence-fixture': {
              comparison_status: 'methodology_pending',
              series: [],
            },
          },
        },
      }),
      React.createElement(MetaCard, {
        cycle: 'pne_2014_2024',
        item,
        onSelect: () => {},
        result: {
          ...baseResult,
          end_value: 70,
          end_year: 2024,
          meta: 60,
          distance: 10,
          atingida: true,
          display: {
            ...baseResult.display,
            distance: '+10,0 p.p.',
            end_value: '70,0%',
            status: 'Meta atingida',
          },
        },
        stateReference: {
          indicators: {
            'trend-independence-fixture': {
              comparison_status: 'comparable',
              series: [{ comparison_status: 'comparable', value: 80, year: 2024 }],
            },
          },
        },
      }),
      React.createElement(MetaCard, {
        cycle: 'pne_2014_2024',
        item,
        onSelect: () => {},
        result: {
          ...baseResult,
          end_value: 60,
          end_year: 2024,
          meta: 60,
          distance: 0,
          atingida: true,
          display: {
            ...baseResult.display,
            distance: '0,0 p.p.',
            end_value: '60,0%',
            status: 'Meta atingida',
          },
        },
        stateReference: {
          indicators: {
            'trend-independence-fixture': {
              comparison_status: 'comparable',
              series: [{ comparison_status: 'comparable', value: 60.02, year: 2024 }],
            },
          },
        },
      }),
    ));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const cards = [...host.querySelectorAll('.meta-card')];
    const result = cards.map((card) => ({
      hasStateReference: Boolean(card.querySelector('.meta-card__state-reference')),
      hasTrend: Boolean(card.querySelector('.meta-card__metric--trend')),
      hasReading: Boolean(card.querySelector('.meta-card__reading')),
      hasSparkline: Boolean(card.querySelector('.meta-card__sparkline')),
      metricCount: card.querySelectorAll('.meta-card__metric').length,
      isMetaSuccess: card.classList.contains('meta-card--success'),
      referenceTone: card.querySelector('.meta-card__state-reference')?.className.match(/--(positive|negative|neutral)/)?.[1] ?? null,
      ariaLabel: card.getAttribute('aria-label'),
    }));
    root.unmount();
    host.remove();
    return result;
  });

  assert.equal(evidence.length, 5, 'Tendência/Referência RS: fixture monta os cinco cenários');
  assert.deepEqual(
    evidence.map(({ hasTrend, hasStateReference, hasReading, hasSparkline, metricCount, isMetaSuccess, referenceTone }) => ({
      hasTrend,
      hasStateReference,
      hasReading,
      hasSparkline,
      metricCount,
      isMetaSuccess,
      referenceTone,
    })),
    [
      { hasTrend: true, hasStateReference: false, hasReading: false, hasSparkline: false, metricCount: 4, isMetaSuccess: false, referenceTone: null },
      { hasTrend: false, hasStateReference: true, hasReading: false, hasSparkline: false, metricCount: 3, isMetaSuccess: false, referenceTone: 'positive' },
      { hasTrend: false, hasStateReference: false, hasReading: false, hasSparkline: false, metricCount: 3, isMetaSuccess: false, referenceTone: null },
      { hasTrend: false, hasStateReference: true, hasReading: false, hasSparkline: false, metricCount: 3, isMetaSuccess: true, referenceTone: 'negative' },
      { hasTrend: false, hasStateReference: true, hasReading: false, hasSparkline: false, metricCount: 3, isMetaSuccess: true, referenceTone: 'neutral' },
    ],
    'Tendência/Referência RS: status da meta e tom do RS permanecem independentes',
  );
  assert.match(
    evidence[0].ariaLabel,
    /Tendência: alta, de 2021 a 2025\./i,
    'Tendência/Referência RS: aria-label não anuncia inclinação',
  );
  assert.doesNotMatch(evidence[0].ariaLabel, /2\.5|p\.p\.\/ano|slope|taxa/i);
  assert.doesNotMatch(evidence[2].ariaLabel, /Tendência|histórico/i);
  assert.equal(evidence[3].isMetaSuccess, true, 'Tendência/Referência RS: acima da meta mantém status positivo');
  assert.equal(evidence[3].referenceTone, 'negative', 'Tendência/Referência RS: acima da meta e abaixo do RS usa tom negativo');
  assert.equal(evidence[4].referenceTone, 'neutral', 'Tendência/Referência RS: diferença próxima de zero usa tom neutro');
}

async function verifyEducationFlow(page, viewport) {
  await navigateTo(page, EDUCATION, EDUCATION);
  const educationSubitems = page.locator('.nav-group--educacao .nav-subitem');
  assert.equal(await educationSubitems.count(), 8, 'EducaÃ§Ã£o: sidebar possui oito seÃ§Ãµes');
  assert.equal(await educationSubitems.first().getAttribute('aria-current'), 'page', 'EducaÃ§Ã£o: VisÃ£o geral Ã© a seÃ§Ã£o inicial');
  assert.equal(await page.locator('.education-card').count(), 7, 'EducaÃ§Ã£o: visÃ£o geral possui sete cards de resumo');
  assert.equal(await page.locator('.education-card__year').count(), 7, 'EducaÃ§Ã£o: cada resumo preserva seu ano');
  assert.equal(await page.locator('.education-indicator-card').count(), 0, 'EducaÃ§Ã£o: visÃ£o geral nÃ£o exibe a grade completa');

  const sectionKeys = ['atendimento', 'trajetoria', 'profissionais', 'infraestrutura', 'modalidades', 'demanda', 'metodologia'];
  for (const sectionKey of sectionKeys) {
    assert.equal(
      await page.locator(`.nav-group--educacao a[href="#educacao?secao=${sectionKey}"]`).count(),
      1,
      `EducaÃ§Ã£o: acesso da seÃ§Ã£o ${sectionKey}`,
    );
  }
  assert.equal(await page.locator('.education-section-link-grid .education-section-link').count(), 6, 'EducaÃ§Ã£o: visÃ£o geral possui seis acessos temÃ¡ticos');
  assert.equal(await page.locator('.education-section-link--secondary').count(), 1, 'EducaÃ§Ã£o: metodologia aparece como acesso secundÃ¡rio');
  await page.goto(BASE_URL + '/#educacao?secao=demanda', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1, name: EDUCATION_DEMAND_TITLE, exact: true }).waitFor({ state: 'visible' });
  await selectMunicipality(page, 'Nova Santa Rita', false);
  await page.getByRole('heading', { level: 1, name: EDUCATION_DEMAND_TITLE, exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.getByRole('heading', { level: 1, name: EDUCATION_DEMAND_TITLE, exact: true }).count(), 1, 'Educação: página unificada possui um único h1 visível');
  assert.equal(await page.getByText('Evolução observada e trajetórias futuras calculadas para indicadores de cobertura e tempo integral.', { exact: true }).count(), 1, 'Educação: descrição geral fica visível');
  assert.equal(await page.getByText('Metas do PNE são referências normativas e não previsões observacionais.', { exact: true }).count(), 1, 'Educação: ressalva geral fica visível');
  assert.equal(await page.getByRole('tablist').count(), 0, 'Educação: filtros usam grupos de botões, sem abas');
  assert.equal(await page.getByRole('group', { name: 'Tipo de indicador', exact: true }).count(), 1, 'Educação: filtro por tipo fica visível');
  const attendanceCutControl = page.getByRole('group', { name: 'Recorte', exact: true });
  assert.equal(await attendanceCutControl.count(), 1, 'Educação: filtro por recorte fica visível');
  assert.deepEqual(
    await attendanceCutControl.getByRole('button').allTextContents(),
    ['Todos', 'Educação Infantil', 'Ensino Fundamental', 'Ensino Médio', 'Faixas combinadas'],
    'Educação: recortes seguem a ordem canônica, sem depender da chegada dos dados',
  );
  assert.equal(await page.locator('.educacao-hero').count(), 0, 'Educação: card institucional de contexto não aparece');
  assert.equal(await page.getByRole('button', { name: 'Voltar aos indicadores', exact: true }).count(), 1, 'Educação: existe somente a ação de voltar no topo');
  assert.equal(await page.locator('.education-attendance-sequence-item').count(), 7, 'Educação: cobertura geral exibe somente os sete indicadores projetados');

  for (const expectedTitle of [
    'Atendimento em creche',
    'Atendimento na pré-escola',
    'Educação básica — 6 a 17 anos',
    'Atendimento de adolescentes',
  ]) {
    assert.equal(await page.getByRole('heading', { level: 2, name: expectedTitle, exact: true }).count(), 1, `Educação: seção ${expectedTitle} está presente`);
  }
  assert.equal(await page.locator('.education-attendance-main-chart').count(), 7, 'Educação: cada cobertura possui um gráfico principal');
  assert.equal(await page.locator('.projection-direct-label').count(), 7, 'Educação: cada projeção possui rótulo direto no ponto final');
  assert.equal(await page.locator('.education-attendance-reading').count(), 7, 'Educação: cada cobertura possui leitura rápida editorial');
  assert.equal(await page.locator('.education-attendance-analysis').count(), 7, 'Educação: coberturas compartilham a estrutura de gráfico e leitura rápida');
  const firstAttendanceCards = page.locator('.education-attendance-kpis').first().locator('.metric-card');
  assert.equal(
    await firstAttendanceCards.locator('.metric-card__icon').count(),
    await firstAttendanceCards.count(),
    'Educação: todos os cards principais possuem ícones semânticos',
  );
  assert.equal(
    await firstAttendanceCards.locator('.metric-card__icon').evaluateAll((icons) => icons.every((icon) => getComputedStyle(icon).display !== 'none')),
    true,
    'Educação: ícones dos cards são visíveis',
  );
  if (viewport.width > 1100) {
    const desktopAnalysis = await page.locator('.education-attendance-analysis').first().evaluate((element) => {
      const chart = element.querySelector('.education-attendance-main-chart').getBoundingClientRect();
      const reading = element.querySelector('.education-attendance-reading').getBoundingClientRect();
      return { chartRight: chart.right, chartTop: chart.top, readingLeft: reading.left, readingTop: reading.top };
    });
    assert.ok(desktopAnalysis.chartRight < desktopAnalysis.readingLeft, 'Educação: leitura rápida fica ao lado do gráfico no desktop');
    assert.ok(Math.abs(desktopAnalysis.chartTop - desktopAnalysis.readingTop) <= 2, 'Educação: gráfico e leitura rápida iniciam alinhados no desktop');
  } else {
    const notebookAnalysis = await page.locator('.education-attendance-analysis').first().evaluate((element) => {
      const chart = element.querySelector('.education-attendance-main-chart').getBoundingClientRect();
      const reading = element.querySelector('.education-attendance-reading').getBoundingClientRect();
      return { chartBottom: chart.bottom, readingTop: reading.top };
    });
    assert.ok(notebookAnalysis.readingTop > notebookAnalysis.chartBottom, 'Educação: leitura rápida empilha abaixo do gráfico no notebook');
  }
  assert.equal(await page.locator('.education-attendance-comparison-table').count(), 0, 'Educação: tabela comparativa foi removida');
  assert.equal(await page.getByRole('button', { name: /Matrículas/ }).count(), 0, 'Educação: Matrículas não aparece no filtro');
  assert.doesNotMatch(await page.locator('.education-attendance-filters').innerText(), /Abrangência geral/i, 'Educação: Faixas combinadas substitui Abrangência geral');
  assert.doesNotMatch(await page.locator('.education-attendance-indicator-list').innerText(), /patamar mantido|cenário de manutenção|último valor constante/i, 'Educação: séries de manutenção não aparecem');

  await page.getByRole('button', { name: 'Ensino Fundamental', exact: true }).click();
  await page.getByRole('heading', { level: 2, name: 'Atendimento escolar — 6 a 14 anos', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.education-attendance-sequence-item').count(), 1, 'Educação: etapa restringe a cobertura a resultados projetados');

  const attendanceFilterHeight = await page.locator('.education-attendance-filters').evaluate((element) => element.getBoundingClientRect().height);
  const integralTypeButton = page.getByRole('button', { name: /Tempo integral\s+1/ });
  await integralTypeButton.click();
  await page.getByRole('heading', { level: 2, name: 'Participação da educação básica em tempo integral', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.education-attendance-sequence-item').count(), 1, 'Educação: tempo integral exibe somente a trajetória geral válida');
  assert.equal(await integralTypeButton.evaluate((element) => document.activeElement === element), true, 'Educação: troca de tipo preserva o foco no controle acionado');
  const integralCutState = page.getByRole('group', { name: 'Recorte', exact: true });
  assert.equal(await integralCutState.count(), 1, 'Educação: linha de recorte permanece visível em Tempo integral');
  assert.equal(await integralCutState.getByRole('button').count(), 0, 'Educação: recorte geral de Tempo integral é informativo e não interativo');
  assert.equal(await integralCutState.getByText('Educação básica', { exact: true }).count(), 1, 'Educação: estado informativo identifica o recorte geral');
  assert.equal(
    await integralCutState.getByText('Tempo integral possui trajetória futura apenas no recorte geral da educação básica.', { exact: true }).count(),
    1,
    'Educação: microcopy explica por que há somente um recorte de Tempo integral',
  );
  const integralFilterHeight = await page.locator('.education-attendance-filters').evaluate((element) => element.getBoundingClientRect().height);
  assert.ok(Math.abs(attendanceFilterHeight - integralFilterHeight) <= 1, 'Educação: área de filtros mantém altura estável ao trocar o tipo');
  assert.equal(await page.locator('.education-attendance-analysis').count(), 1, 'Educação: Tempo integral usa a mesma estrutura geral das coberturas');
  assert.equal(await page.locator('.education-attendance-reading').count(), 1, 'Educação: Tempo integral possui leitura rápida ao lado do gráfico');
  assert.match(await page.locator('.education-attendance-indicator-list').innerText(), /Meta do PNE em 2036|Distância para a meta/, 'Educação: tempo integral explicita meta e distância');
  assert.equal(
    await page.locator('.projection-direct-label text').getByText('2036 · Cenário e meta PNE: 50,0%', { exact: true }).count(),
    1,
    'Educação: trajetória de planejamento coincidente usa um único rótulo final',
  );

  await page.getByRole('button', { name: /Cobertura\s+7/ }).click();
  await page.getByRole('heading', { level: 2, name: 'Atendimento em creche', exact: true }).waitFor({ state: 'visible' });
  const selectedCoverageCount = page.getByRole('button', { name: /Cobertura\s+7/ }).locator('.category-tab__count');
  const selectedCoverageCountStyle = await selectedCoverageCount.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      visibility: style.visibility,
    };
  });
  assert.equal(selectedCoverageCountStyle.visibility, 'visible', 'Educação: contador do filtro selecionado permanece visível');
  assert.notEqual(selectedCoverageCountStyle.color, selectedCoverageCountStyle.backgroundColor, 'Educação: contador selecionado preserva contraste entre texto e fundo');
  const attendanceHeaderDescription = await page.locator('.education-compact-header__description > span').first().evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(style.lineHeight),
    };
  });
  assert.ok(
    attendanceHeaderDescription.height <= attendanceHeaderDescription.lineHeight * 2 + 1,
    'Educação: subtítulo principal do cabeçalho ocupa no máximo duas linhas no desktop',
  );
  await page.getByRole('button', { name: 'Faixas combinadas', exact: true }).click();
  assert.equal(await page.locator('.education-attendance-sequence-item').count(), 2, 'Educação: Faixas combinadas reúne somente recortes que atravessam etapas');
  assert.equal(await page.getByRole('heading', { level: 2, name: 'Educação básica — 6 a 17 anos', exact: true }).count(), 1, 'Educação: título explicita a faixa de 6 a 17 anos');
  assert.equal(await page.getByRole('heading', { level: 2, name: 'Escolaridade obrigatória — 4 a 17 anos', exact: true }).count(), 1, 'Educação: título explicita a faixa de 4 a 17 anos');
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  const attendanceLabelsDoNotOverlap = await page.locator('.education-attendance-main-chart').evaluateAll((charts) => charts.every((chart) => {
    const labels = [...chart.querySelectorAll('.chart-meta-label, .projection-direct-label text')];
    return labels.every((label, index) => labels.slice(index + 1).every((other) => {
      const left = label.getBoundingClientRect();
      const right = other.getBoundingClientRect();
      return left.right <= right.left + 1 || right.right <= left.left + 1 || left.bottom <= right.top + 1 || right.bottom <= left.top + 1;
    }));
  }));
  assert.equal(attendanceLabelsDoNotOverlap, true, 'Educação: rótulos finais distintos não colidem');
  assert.equal(await page.locator('.education-attendance-main-chart .chart-meta-label').count(), 0, 'Educação: meta permanece na legenda sem repetir texto dentro do gráfico');
  assert.doesNotMatch(page.url(), /detalhe=/, 'Educação: filtros não gravam indicador individual no hash');
  const methodologyDisclosure = page.locator('.education-attendance-methodology');
  assert.equal(await methodologyDisclosure.count(), 1, 'Educação: existe uma única metodologia e fontes');
  assert.equal(await page.locator('.education-attendance-page').evaluate((node) => node.lastElementChild?.classList.contains('education-attendance-methodology')), true, 'Educação: metodologia é o último conteúdo');
  assert.doesNotMatch(await page.locator('.education-attendance-detail-view').innerText(), /escolas em tempo integral|pós-graduação|contratos temporários/i, 'Educação: recortes fora do escopo não aparecem como seções principais');
  const attendanceMethodologyText = await methodologyDisclosure.innerText();
  assert.match(attendanceMethodologyText, /Como as projeções são construídas|Cobertura escolar|Tempo integral|Fontes e recorte/i, 'Educação: metodologia explica o cálculo em linguagem pública');
  assert.doesNotMatch(attendanceMethodologyText, /contrato de cada indicador|Critério de publicação|Indicadores de matrículas|Metas do PNE/i, 'Educação: metodologia remove critérios internos e mensagens redundantes');
  assert.doesNotMatch(page.url(), /detalhe=/, 'Educação: a página unificada não grava indicador individual no hash');

  await selectMunicipality(page, 'Aceguá', false);
  await page.getByRole('heading', { level: 1, name: EDUCATION_DEMAND_TITLE, exact: true }).waitFor({ state: 'visible' });
  assert.match(page.url(), /secao=demanda/, 'Educação: troca municipal preserva a página unificada');
  assert.ok(await page.locator('.education-attendance-sequence-item').count() > 0, 'Educação: troca municipal recalcula os indicadores projetados');
  await page.goto(BASE_URL + '/#educacao?secao=demanda&detalhe=pre_escola', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1, name: EDUCATION_DEMAND_TITLE, exact: true }).waitFor({ state: 'visible' });
  assert.ok(await page.locator('.education-attendance-sequence-item').count() > 0, 'Educação: URL antiga continua abrindo a página completa');
  const cappedPanel = page.locator('[aria-labelledby="education-attendance-pre_escola-title"]');
  const cappedPanelText = await cappedPanel.innerText();
  assert.match(cappedPanelText, /100,0%/, 'Educação: valor superior ao limite é apresentado como 100%');
  assert.doesNotMatch(cappedPanelText, /122[,.]2%|114[,.]9%|Acima de 100%|cobertura universal/i, 'Educação: bruto superior a 100% não aparece no painel');
  assert.equal(
    await page.locator('.education-attendance-main-chart .chart-mark').evaluateAll((points) => points.every((point) => {
      const match = (point.getAttribute('aria-label') ?? '').match(/(\d+(?:[,.]\d+)?)%/);
      return !match || Number(match[1].replace(',', '.')) <= 100;
    })),
    true,
    'Educação: labels acessíveis do gráfico respeitam o limite',
  );
  await page.getByRole('heading', { level: 2, name: 'Como as projeções são construídas', exact: true }).waitFor({ state: 'visible' });


  await page.goto(BASE_URL + '/#educacao?secao=metodologia', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1, name: 'Metodologia e fontes', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.education-methodology-source').count(), 9, 'Educação: Metodologia deriva nove fontes do catálogo');
  assert.equal(await page.getByText('52 indicadores catalogados', { exact: false }).count(), 1, 'Educação: Metodologia deriva o total do catálogo');
  for (const title of ['Escopo do diagnóstico', 'Fontes e periodicidade', 'Como interpretar', 'Limitações', 'Consulte também']) {
    await page.getByRole('heading', { level: 3, name: title, exact: true }).waitFor({ state: 'visible' });
  }
  assert.equal(await page.locator('.educacao-page a[href="#pne-overview"]').count(), 1, 'Educação: link para PNE');
  assert.equal(await page.locator('.educacao-page a[href="#financeiros"]').count(), 1, 'Educação: link para Financeiros');

  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 2, name: 'Atendimento na pré-escola', exact: true }).waitFor({ state: 'visible' });
  await page.goForward({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1, name: 'Metodologia e fontes', exact: true }).waitFor({ state: 'visible' });
  await page.goto(BASE_URL + '/#educacao', { waitUntil: 'domcontentloaded' });
  await page.locator('.education-section-link-grid').waitFor({ state: 'visible' });

  await page.locator('.education-section-link-grid a[href="#educacao?secao=atendimento"]').click();
  const searchInput = page.getByLabel('Buscar indicador');
  await searchInput.waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.activeElement?.matches('h1.programmatic-focus-target') && window.scrollY === 0);
  assert.match(page.url(), /#educacao\?secao=atendimento/);
  assert.equal(await educationSubitems.nth(1).getAttribute('aria-current'), 'page', 'EducaÃ§Ã£o: seÃ§Ã£o Atendimento fica ativa');
  await searchInput.focus();
  assert.equal(await searchInput.evaluate((element) => document.activeElement === element), true, 'Educação: foco da busca');
  assert.equal(await searchInput.getAttribute('aria-label'), 'Buscar indicador', 'Educação: nome acessível da busca');

  const sectionGroups = page.locator('.education-indicator-group');
  assert.equal(await sectionGroups.count(), 3, 'Educação: Atendimento preserva os três grupos catalogados');
  for (const groupName of ['Matrículas e atendimento', 'Oferta por etapa', 'Redes de ensino']) {
    await page.getByRole('heading', { level: 3, name: groupName, exact: true }).waitFor({ state: 'visible' });
  }
  const cards = page.getByRole('button', { name: EXPLORABLE_CARD_NAME });
  const initialCount = await cards.count();
  assert.ok(initialCount > 0, 'Educação: deve haver indicadores no tema ativo');
  await assertExplorableCardGridColumns(
    page.locator('.education-indicator-card-grid').first(),
    viewport,
    'Educação: grade de cards',
  );

  const card = await firstExplorableCard(page);
  const cardName = await card.getAttribute('aria-label');
  const cardSearchLabel = await card.locator('.education-indicator-card__title').innerText();
  assert.match(cardName, /Valor .+, ano \d{4}|ano indispon\u00edvel/, 'Educa\u00e7\u00e3o: nome acess\u00edvel do card inclui valor e ano');
  await assertEducationIndicatorCardStructure(card, {
    classes: EDUCATION_CARD_CLASSES,
    context: 'Educa\u00e7\u00e3o: card com hist\u00f3rico',
  });
  await assertAuxiliaryTextLegibility(
    card.locator('.education-indicator-card__footer > span').first(),
    `Educa\u00e7\u00e3o em ${viewport.width}x${viewport.height}`,
  );
  const noComparisonCard = page.getByRole('button', { name: EDUCATION_NO_COMPARISON_CARD });
  assert.equal(await noComparisonCard.count(), 1, 'Educa\u00e7\u00e3o: card de s\u00e9rie insuficiente deve ser \u00fanico');
  await assertEducationCardWithoutComparison(noComparisonCard, 'Educa\u00e7\u00e3o: card sem compara\u00e7\u00e3o');
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
  await searchInput.fill(cardSearchLabel);
  await page.getByRole('button', { name: cardName, exact: true }).waitFor({ state: 'visible' });
  const foundCount = await cards.count();
  assert.ok(foundCount > 0 && foundCount < initialCount, 'Educação: busca deve restringir o tema ativo');
  assert.equal(await page.locator('.education-indicator-group').count(), 1, 'Educação: busca preserva apenas o grupo com resultado');

  await searchInput.fill('consulta sem resultado');
  await page.getByText(EDUCATION_EMPTY, { exact: true }).waitFor({ state: 'visible' });
  assert.equal(await cards.count(), 0, 'Educação: busca sem resultado');
  assert.equal(await page.locator('.education-indicator-group').count(), 0, 'Educação: busca sem resultado oculta os grupos');

  const clearSearchButton = page.getByRole('button', { name: 'Limpar busca', exact: true });
  assert.equal(await clearSearchButton.count(), 1, 'Educa\u00e7\u00e3o: busca preenchida oferece limpeza expl\u00edcita');
  await clearSearchButton.click();
  await page.getByRole('button', { name: cardName, exact: true }).waitFor({ state: 'visible' });
  assert.equal(await searchInput.evaluate((element) => document.activeElement === element), true, 'Educacao: limpeza devolve o foco ao campo de busca');
  assert.equal(await cards.count(), initialCount, 'Educação: limpeza manual restaura a lista');
  assert.equal(await page.locator('.education-indicator-group').count(), 3, 'Educação: limpeza restaura os grupos');
  await page.getByRole('heading', { level: 3, name: 'Redes de ensino', exact: true }).waitFor({ state: 'visible' });
  const totalSchoolsCard = page.getByRole('button', {
    name: /^Abrir detalhe do indicador Total de escolas\./,
  });
  await totalSchoolsCard.click();

  const educationSupportSection = page.locator('section.education-support-data--organized');
  const educationSupportCards = educationSupportSection.locator('.education-support-data__item');
  await educationSupportSection.getByRole('heading', { name: 'Dados de apoio do indicador', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('details.education-support-data').count(), 0, 'Educação: dados de apoio não ficam ocultos em disclosure');
  assert.equal(await page.getByRole('tablist', { name: 'Detalhamentos do indicador' }).count(), 0, 'Educação: dados de apoio não alternam conteúdo por abas');
  assert.ok(await educationSupportCards.count() >= 2, 'Educação: recortes complementares aparecem como cards visíveis');

  const visibleSupportCards = await educationSupportCards.evaluateAll((elements) => elements.map((element) => ({
    height: element.getBoundingClientRect().height,
    width: element.getBoundingClientRect().width,
  })));
  assert.ok(visibleSupportCards.every(({ height, width }) => height > 0 && width > 0), 'Educação: todos os cards de apoio permanecem visíveis');

  const schoolStageCard = educationSupportCards.filter({
    has: page.locator('.education-support-data__item-heading').filter({ hasText: 'Por etapa' }),
  });
  const schoolNetworkCard = educationSupportCards.filter({
    has: page.locator('.education-support-data__item-heading').filter({ hasText: 'Por rede' }),
  });
  assert.equal(await schoolStageCard.count(), 1, 'Educação: recorte por etapa aparece uma vez');
  assert.equal(await schoolNetworkCard.count(), 1, 'Educação: recorte por rede aparece uma vez');

  const educationStageSource = schoolStageCard.getByText(SISTEMA_S_SOURCE, { exact: true });
  const educationStageMethod = schoolStageCard.getByText(EDUCATION_SCHOOL_STAGE_METHOD, { exact: true });
  await educationStageMethod.waitFor({ state: 'visible' });
  assert.equal(await educationStageSource.count(), 0, 'Educa\u00e7\u00e3o: fonte n\u00e3o se repete no recorte por etapa');
  assert.equal(await educationStageMethod.count(), 1, 'Educa\u00e7\u00e3o: metodologia do recorte por etapa aparece uma vez');

  const educationStageNoteOrder = await educationStageMethod.evaluate((element) => ({
    className: element.className,
    tagName: element.tagName,
  }));
  assert.equal(educationStageNoteOrder.tagName, 'P', 'Educa\u00e7\u00e3o: metodologia preserva o par\u00e1grafo');
  assert.equal(educationStageNoteOrder.className, 'educacao-explore__note', 'Educa\u00e7\u00e3o: metodologia preserva a classe');

  assert.equal(await schoolNetworkCard.getByText(EDUCATION_SCHOOL_STAGE_METHOD, { exact: true }).count(), 0, 'Educa\u00e7\u00e3o: metodologia n\u00e3o aparece em recorte sem nota');
  assert.equal(await schoolNetworkCard.getByText(SISTEMA_S_SOURCE, { exact: true }).count(), 0, 'Educa\u00e7\u00e3o: fonte n\u00e3o se repete no recorte por rede');
  assert.equal(await educationSupportSection.locator('.education-support-data__footer').getByText(SISTEMA_S_SOURCE, { exact: true }).count(), 1, 'Educa\u00e7\u00e3o: fonte consolidada encerra os dados de apoio');

  await page.getByRole('button', { name: 'Voltar aos indicadores', exact: true }).first().click();
  await totalSchoolsCard.waitFor({ state: 'visible' });
  await page.goto(BASE_URL + '/#educacao?secao=infraestrutura&detalhe=rede-infraestrutura', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1, name: 'Infraestrutura', exact: true }).waitFor({ state: 'visible' });
  const infrastructureNetworkControl = page.getByRole('group', { name: 'Rede exibida', exact: true });
  const infrastructureNetworkOptions = infrastructureNetworkControl.getByRole('button');
  assert.equal(await infrastructureNetworkOptions.count(), 4, 'Educa\u00e7\u00e3o: infraestrutura preserva quatro recortes de rede');
  const infrastructureTargets = await infrastructureNetworkOptions.evaluateAll((elements) => elements.map((element) => ({
    height: element.getBoundingClientRect().height,
    pressed: element.getAttribute('aria-pressed'),
  })));
  assert.ok(infrastructureTargets.every(({ height }) => height >= 44), 'Educa\u00e7\u00e3o: recortes de infraestrutura preservam alvo de 44 px');
  assert.equal(infrastructureTargets.filter(({ pressed }) => pressed === 'true').length, 1, 'Educa\u00e7\u00e3o: infraestrutura possui uma rede selecionada');
  const municipalNetwork = infrastructureNetworkControl.getByRole('button', { name: 'Municipal', exact: true });
  await municipalNetwork.click();
  assert.equal(await municipalNetwork.getAttribute('aria-pressed'), 'true', 'Educa\u00e7\u00e3o: rede municipal atualiza estado pressionado');
  await page.locator('.nav-group--educacao .nav-subitem').filter({ hasText: 'Visão geral' }).evaluate((element) => element.click());
  await page.locator('.education-section-link-grid').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.education-card').count(), 7, 'Educacao: item pai retorna a Visao geral a partir de uma subsecao');
  await page.goto(BASE_URL + '/#educacao?secao=profissionais', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 3, name: 'Organiza\u00e7\u00e3o das turmas', exact: true }).waitFor({ state: 'visible' });
  const wideStageCard = page.getByRole('button', { name: WIDE_STAGE_CARD });
  await wideStageCard.click();
  const historyCut = page.getByLabel(EDUCATION_HISTORY_CUT, { exact: true });
  const historyOptions = historyCut.locator('option');
  await historyCut.waitFor({ state: 'visible' });
  assert.equal(await historyCut.evaluate((element) => element.tagName), 'SELECT', 'Educa\u00e7\u00e3o: recorte amplo usa seletor compacto');
  assert.ok(await historyOptions.count() > 4, 'Educa\u00e7\u00e3o: recorte amplo preserva mais de quatro op\u00e7\u00f5es');
  assert.equal(await historyCut.evaluate((element) => element.selectedOptions[0]?.textContent?.trim()), 'Total — Ensino Fundamental', 'Educa\u00e7\u00e3o: recorte inicial');

  await historyCut.selectOption({ label: 'Anos Iniciais' });
  await page.getByText(/Recorte exibido: Anos Iniciais/).waitFor({ state: 'visible' });
  assert.equal(await historyCut.evaluate((element) => element.selectedOptions[0]?.textContent?.trim()), 'Anos Iniciais', 'Educa\u00e7\u00e3o: seletor atualiza o recorte');

  await historyCut.selectOption({ label: 'Anos Finais' });
  await page.getByText(/Recorte exibido: Anos Finais/).waitFor({ state: 'visible' });
  assert.equal(await historyCut.evaluate((element) => element.selectedOptions[0]?.textContent?.trim()), 'Anos Finais', 'Educa\u00e7\u00e3o: seletor preserva uma op\u00e7\u00e3o ativa');
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
  await page.locator('.nav-group--pne .nav-subitem').filter({ hasText: DIAGNOSIS }).evaluate((element) => element.click());
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

async function verifyCurrentFinanceFlow(page, viewport) {
  const overviewLinks = page.locator('.financial-overview-page a[href^="#financeiros-"]');
  assert.equal(await overviewLinks.count(), 4, 'Financeiros: vis\u00e3o geral lista quatro m\u00f3dulos');

  const modules = [
    {
      cards: true,
      heading: 'Financiamento e Execu\u00e7\u00e3o dos Recursos da Educa\u00e7\u00e3o',
      panel: '.siope-panel',
      route: 'financeiros-aplicacao-recursos',
    },
    { cards: true, heading: 'FUNDEB', panel: '.fundeb-panel-embedded', route: 'financeiros-fundeb' },
    { cards: false, heading: 'Complementa\u00e7\u00e3o VAAR', panel: '.vaar-panel', route: 'financeiros-vaar' },
    { cards: true, heading: 'PNATE', panel: '.fundeb-panel-embedded', route: 'financeiros-pnate' },
  ];

  for (const module of modules) {
    await page.goto(`${BASE_URL}/#${module.route}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1, name: module.heading, exact: true }).waitFor({ state: 'visible' });

    const selector = page.getByLabel('M\u00f3dulo financeiro', { exact: true });
    assert.equal(await selector.count(), 1, `Financeiros: seletor estrutural de ${module.route} presente`);
    assert.equal(await selector.evaluate((element) => element.value), module.route, `Financeiros: rota ${module.route} selecionada`);
    const modulePanel = page.locator(module.panel);
    await modulePanel.waitFor({ state: 'visible' });
    assert.equal(await modulePanel.count(), 1, `Financeiros: painel ${module.route} presente`);
    await assertNoHorizontalOverflow(page, `${module.heading} em ${viewport.width}x${viewport.height}`);

    if (!module.cards) continue;

    const cards = page.locator('.financial-indicator-card');
    assert.ok(await cards.count() > 0, `Financeiros: ${module.route} exibe cards`);
    const detailCards = page.getByRole('button', { name: EXPLORABLE_CARD_NAME });
    assert.ok(await detailCards.count() > 0, `Financeiros: ${module.route} possui detalhes acionáveis`);
    const detailCard = detailCards.first();
    const cardName = await detailCard.getAttribute('aria-label');
    await detailCard.click();
    assert.match(page.url(), /#financeiros-[^?]+\?detalhe=[^&]+/, `Financeiros: ${module.route} serializa detalhe`);

    const backButtons = page.getByRole('button', { name: 'Voltar aos indicadores', exact: true });
    assert.ok(await backButtons.count() > 0, `Financeiros: ${module.route} oferece retorno`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await backButtons.first().waitFor({ state: 'visible' });
    await backButtons.first().click();
    await page.getByRole('button', { name: cardName, exact: true }).waitFor({ state: 'visible' });
    assert.doesNotMatch(page.url(), /detalhe=/, `Financeiros: ${module.route} fecha detalhe`);
  }
}

async function verifyFinanceFlow(page, viewport) {
  await navigateTo(page, FINANCE, FINANCE_TITLE);

  const moduleTabs = page.getByRole('tablist', {
    name: 'M\u00f3dulos de financiamento da educa\u00e7\u00e3o',
  });
  if (await moduleTabs.count() === 0) {
    await verifyCurrentFinanceFlow(page, viewport);
    return;
  }
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

  await navigateTo(page, FINANCE, FINANCE_TITLE);
  await navigateTo(page, EDUCATION, EDUCATION);
  await page.getByRole('heading', { level: 2, name: 'Visão geral', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.sistema-s-panel').count(), 0, `${context}: navegação para Educação abre a Visão geral`);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 2, name: 'Visão geral', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.sistema-s-panel').count(), 0, `${context}: recarregamento preserva a Visão geral`);

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
    await page.getByRole('heading', { level: 2, name: 'Visão geral', exact: true }).waitFor({ state: 'visible' });
    assert.equal(await page.locator('.sistema-s-panel').count(), 0, `${context}: municipio sem Sistema S usa o fallback apos a resposta`);
    await assertNoHorizontalOverflow(page, `${context} sem dados`);
  } finally {
    await missingSistemaSRequest.dispose();
  }
}

async function verifyAddressableNavigation(page, viewport) {
  const context = `Hash estável em ${viewport.width}x${viewport.height}`;
  await page.goto(`${BASE_URL}/#financeiros?modulo=fundeb`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1, name: 'FUNDEB', exact: true }).waitFor({ state: 'visible' });
  const financialSelector = page.getByLabel('Módulo financeiro', { exact: true });
  if (await financialSelector.count() === 1) {
    const financialModules = [
      { key: 'fundeb', route: 'financeiros-fundeb', title: 'FUNDEB' },
      { key: 'pnate', route: 'financeiros-pnate', title: 'PNATE' },
      { key: 'siope', route: 'financeiros-aplicacao-recursos', title: 'Financiamento e Execução dos Recursos da Educação' },
    ];
    for (const module of financialModules) {
      await page.goto(`${BASE_URL}/#financeiros?modulo=${module.key}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { level: 1, name: module.title, exact: true }).waitFor({ state: 'visible' });
      const selector = page.getByLabel('Módulo financeiro', { exact: true });
      assert.equal(await selector.count(), 1, `${context}: seletor de ${module.key} presente`);
      assert.equal(await selector.evaluate((element) => element.value), module.route, `${context}: ${module.key} resolve rota`);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { level: 1, name: module.title, exact: true }).waitFor({ state: 'visible' });
      assert.equal(await selector.evaluate((element) => element.value), module.route, `${context}: ${module.key} preserva rota na recarga`);
    }
  } else {
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
  }

  await page.goto(`${BASE_URL}/#educacao?tema=rede`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 2, name: 'Atendimento e oferta', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.education-indicator-group').count(), 3, 'tema direto resolve a seção');
  const card = page.getByRole('button', { name: EXPLORABLE_CARD_NAME }).first();
  await card.click();
  assert.match(page.url(), /detalhe=[^&]+/, `${context}: abertura registra detalhe`);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await card.waitFor({ state: 'visible' });
  assert.doesNotMatch(page.url(), /detalhe=/, `${context}: voltar fecha detalhe`);

  await page.goto(`${BASE_URL}/#contexto-invalido`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.nav-item--home').getAttribute('aria-current'), 'page', `${context}: contexto inválido usa Home`);
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
    await assertEffectiveViewport(page, viewport);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
    await assertNoHorizontalOverflow(page, `Home em ${viewportLabel}`);

    await selectMunicipality(page);
    await assertNoHorizontalOverflow(page, `Home com município em ${viewportLabel}`);
    await assertPriorityContentInFirstFold(page, viewport);
    if (viewport.width === 1366) {
      await verifySidebarDesktopFlow(page, viewport);
    }

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
    if (viewport.width === 390) {
      await verifySidebarMobileDrawerFlow(page, viewport);
    }
    await navigateTo(page, EDUCATION, EDUCATION);
    await page.goto(`${BASE_URL}/#educacao?secao=atendimento`, { waitUntil: 'domcontentloaded' });
    const educationGrids = page.locator('.education-indicator-card-grid');
    assert.ok(await educationGrids.count() > 0, `Educação em ${viewportLabel}: grades de indicadores presentes`);
    const educationGrid = educationGrids.first();
    await educationGrid.waitFor({ state: 'visible' });
    await assertNoHorizontalOverflow(page, `Educação em ${viewportLabel}`);
    const columns = await educationGrid.evaluate((element) => (
      getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
    ));
    const expectedColumns = viewport.width > 620 ? 2 : 1;
    assert.equal(columns, expectedColumns, `Educação: ${expectedColumns} coluna(s) na grade em ${viewportLabel}`);

    await page.goto(`${BASE_URL}/#educacao?secao=demanda`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1, name: EDUCATION_DEMAND_TITLE, exact: true }).waitFor({ state: 'visible' });
    await assertNoHorizontalOverflow(page, `Educação — Demanda em ${viewportLabel}`);
    const demandGrid = page.locator('.education-attendance-kpis').first();
    const demandColumns = await demandGrid.evaluate((element) => (
      getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
    ));
    const expectedDemandColumns = viewport.width > 820 ? 4 : viewport.width > 460 ? 2 : 1;
    assert.equal(demandColumns, expectedDemandColumns, `Educação — Demanda: KPIs usam ${expectedDemandColumns} coluna(s) em ${viewportLabel}`);
    const responsiveAttendanceAnalysis = await page.locator('.education-attendance-analysis').first().evaluate((element) => {
      const chart = element.querySelector('.education-attendance-main-chart').getBoundingClientRect();
      const reading = element.querySelector('.education-attendance-reading').getBoundingClientRect();
      return { chartBottom: chart.bottom, readingTop: reading.top };
    });
    assert.ok(
      responsiveAttendanceAnalysis.readingTop > responsiveAttendanceAnalysis.chartBottom,
      `Educação — Demanda: leitura rápida fica abaixo do gráfico em ${viewportLabel}`,
    );
    const demandAxisLabels = page.locator('.education-attendance-main-chart').first().locator('.chart-x-labels text');
    const demandAxisYears = await demandAxisLabels.allTextContents();
    assert.ok(demandAxisYears.includes('2014'), `Educação — Demanda: primeiro ano visível em ${viewportLabel}`);
    assert.ok(demandAxisYears.includes('2036'), `Educação — Demanda: 2036 visível em ${viewportLabel}`);
    assert.equal(
      await demandAxisLabels.evaluateAll((labels) => labels.every((label) => Number.parseFloat(getComputedStyle(label).fontSize) >= 12)),
      true,
      `Educação — Demanda: eixos preservam fonte mínima de 12 px em ${viewportLabel}`,
    );

    await navigateTo(page, PNE_2026, PNE_2026);
    await assertNoHorizontalOverflow(page, `${PNE_2026} em ${viewportLabel}`);
    const trendCard = page.locator('.meta-card--next-cycle.meta-card--has-trend').first();
    await trendCard.waitFor({ state: 'visible' });
    const trendColumns = await trendCard.locator('.meta-card__value-row').evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
    );
    const expectedTrendColumns = viewport.width <= 680 ? 2 : 4;
    assert.equal(
      trendColumns,
      expectedTrendColumns,
      `${PNE_2026}: tendência usa ${expectedTrendColumns} colunas em ${viewportLabel}`,
    );
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
    await navigateTo(page, PNE_2014, PNE_2014);
    const closedCard = page.locator('.meta-card--closed-cycle').first();
    await closedCard.waitFor({ state: 'visible' });
    const closedColumns = await closedCard.locator('.meta-card__value-row').evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
    );
    assert.equal(
      closedColumns,
      viewport.width <= 680 ? 2 : 3,
      `${PNE_2014}: card encerrado reorganiza as três métricas em ${viewportLabel}`,
    );
    assert.equal(
      await closedCard.locator('.meta-card__metric--current').evaluate((element) => getComputedStyle(element).gridColumn),
      viewport.width <= 680 ? '1 / -1' : 'auto',
      `${PNE_2014}: resultado municipal preserva destaque em ${viewportLabel}`,
    );
    assert.equal(await closedCard.locator('.meta-card__sparkline').count(), 0, `${PNE_2014}: sem sparkline no mobile`);
    assert.equal(await closedCard.locator('.meta-card__reading').count(), 0, `${PNE_2014}: sem leitura textual no mobile`);
    await assertNoHorizontalOverflow(page, `${PNE_2014} em ${viewportLabel}`);
    await auditPrimaryPagesAtMobile(page, viewport);
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
    await assertNoHorizontalOverflow(page, `Sistema S em ${viewportLabel}`);
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
