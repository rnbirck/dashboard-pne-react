import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const root = process.cwd()
const outputDir = path.join(root, 'outputs', '019f659a-6337-79a0-b39b-31e6ef8d29f3')
const outputPath = path.join(outputDir, 'catalogo_indicadores_plataforma_pne.xlsx')

const URLS = Object.freeze({
  censoEscolar: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar',
  indicadoresEducacionais: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/indicadores-educacionais',
  saeb: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/saeb/resultados',
  censo2022: 'https://www.ibge.gov.br/estatisticas/sociais/saude/22827-censo-demografico-2022.html',
  estimativasPopulacionais: 'https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html',
  pne2026: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15388.htm',
  siope: 'https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope',
  fundeb: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/fundeb-home/',
  pnate: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnate',
  leiFundeb: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14113.htm',
})

const CENSUS_KEYS = new Set([
  'alfabetizacao_pop_15_mais',
  'fundamental_concluido_18_mais',
  'fundamental_concluido_15_29',
  'medio_concluido_18_mais',
  'medio_concluido_18_29',
  'escolaridade_media_18_29',
  'razao_escolaridade_racial_18_29',
  'ensino_medio_ou_basica_completa_pop_15_17',
  'ensino_fundamental_ou_completo_pop_6_14',
])

const POPULATION_ATTENDANCE_KEYS = new Set(['creche', 'pre_escola', 'basico_6_17', 'basico_15_17'])
const HEADERS = [
  'Aba / ciclo / módulo',
  'Seção / categoria',
  'Tipo',
  'Código',
  'Indicador',
  'Descrição',
  'Meta relacionada',
  'Texto / referência da meta',
  'Como foi construído',
  'Período de análise',
  'Indicadores / dados de apoio da meta',
  'Período dos dados de apoio',
  'Fonte',
  'URL oficial',
  'Observações',
]

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'))
}

async function importLocal(relativePath) {
  return import(pathToFileURL(path.join(root, relativePath)).href)
}

async function importEducationCatalog() {
  const relativePath = 'src/data/educationIndicatorCatalog.js'
  let source = await fs.readFile(path.join(root, relativePath), 'utf8')
  source = source.replace(
    /import\s*\{\s*normalizeRouteValue\s*\}\s*from\s*['"]\.\.\/app\/appHash\.js['"]\s*/,
    '',
  )
  source = `const normalizeRouteValue = (value) => String(value ?? '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')\n${source}`
  return import(`data:text/javascript;base64,${Buffer.from(source, 'utf8').toString('base64')}`)
}

function addYear(set, value) {
  const year = Number(value)
  if (Number.isFinite(year) && year >= 1900 && year <= 2100) set.add(year)
}

function addYearsFromRows(set, rows, yearKeys = ['ano', 'year', 'ano_fundeb']) {
  if (!Array.isArray(rows)) return
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    for (const key of yearKeys) {
      if (row[key] != null) addYear(set, row[key])
    }
  }
}

function ensureSet(map, key) {
  if (!map.has(key)) map.set(key, new Set())
  return map.get(key)
}

function ensureNestedSet(map, key1, key2) {
  if (!map.has(key1)) map.set(key1, new Map())
  return ensureSet(map.get(key1), key2)
}

function sortedYears(set) {
  return [...(set ?? [])].map(Number).filter(Number.isFinite).sort((a, b) => a - b)
}

function isConsecutive(years) {
  return years.every((year, index) => index === 0 || year === years[index - 1] + 1)
}

function formatPeriod(set, periodicity = '') {
  const years = sortedYears(set)
  if (!years.length) return 'Sem série disponível na base atual'
  const suffix = periodicity ? `; periodicidade ${periodicity.toLocaleLowerCase('pt-BR')}` : ''
  if (years.length === 1) return `${years[0]}${suffix}`
  if (isConsecutive(years)) return `${years[0]}–${years.at(-1)}${suffix}`
  if (years.length <= 6) return `${years.join(', ')}${suffix}`
  return `${years[0]}–${years.at(-1)} (${years.length} pontos disponíveis${suffix})`
}

function filterYears(set, min, max) {
  return new Set(sortedYears(set).filter((year) => year >= min && year <= max))
}

function collectPathYearRows(rootObject, seriesPath) {
  const tokens = String(seriesPath ?? '').split('.').filter(Boolean)
  let nodes = [rootObject]
  for (const rawToken of tokens) {
    const token = rawToken.replace(/\[\]$/, '')
    const next = []
    for (const node of nodes) {
      if (node == null) continue
      if (Array.isArray(node)) {
        // Once a series array is reached, the period is carried by its row objects.
        next.push(node)
      } else if (token === '<etapa>') {
        if (typeof node === 'object') next.push(...Object.values(node))
      } else if (typeof node === 'object' && token in node) {
        next.push(node[token])
      }
    }
    nodes = next
    if (!nodes.length) break
  }
  return nodes.flatMap((node) => Array.isArray(node) ? node : [])
}

function sourceUrlsForPne(key, item, cycle) {
  const urls = []
  const text = `${item.label ?? ''} ${item.desc ?? ''}`.toLocaleLowerCase('pt-BR')
  if (POPULATION_ATTENDANCE_KEYS.has(key)) urls.push(URLS.censoEscolar, URLS.estimativasPopulacionais)
  else if (CENSUS_KEYS.has(key) || text.includes('censos demográficos')) urls.push(URLS.censo2022)
  else if (key.includes('saeb') || key.includes('ideb') || text.includes('alfabetiz')) urls.push(URLS.saeb)
  else if (key.includes('rendimento') || key.startsWith('idade_regular')) urls.push(URLS.indicadoresEducacionais)
  else urls.push(URLS.censoEscolar)
  if (cycle === 'pne_2026_2036') urls.push(URLS.pne2026)
  return [...new Set(urls)].join('\n')
}

function sourceUrlsForEducation(source) {
  const text = String(source ?? '').toLocaleLowerCase('pt-BR')
  if (text.includes('saeb') || text.includes('ideb') || text.includes('alfabetiza')) return URLS.saeb
  if (text.includes('rendimento') || text.includes('distorção') || text.includes('inse')) return URLS.indicadoresEducacionais
  return URLS.censoEscolar
}

function joinNotes(parts) {
  return [...new Set(parts.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))].join(' ')
}

function buildPneConstruction(item, detail, methodology) {
  const parts = [item.desc]
  const numerator = detail?.calculation?.numerator_label
  const denominator = detail?.calculation?.denominator_label
  if (numerator && denominator) {
    parts.push(`Memória de cálculo exibida: ${numerator} ÷ ${denominator} × 100.`)
  }
  if (methodology) parts.push(`Nota metodológica: ${methodology}`)
  return joinNotes(parts)
}

function buildSupportData({ cycle, key, mainYears, detailAgg, projectionAgg, privateAvailableSince }) {
  const detail = detailAgg.get(key)
  const supports = []
  const periods = []
  const isCensus = CENSUS_KEYS.has(key)
  const clip = (set) => isCensus
    ? new Set(sortedYears(set))
    : cycle === 'pne_2014_2024'
      ? filterYears(set, 2014, 2024)
      : filterYears(set, sortedYears(mainYears)[0] ?? 1900, 2036)

  if (detail) {
    if (key === 'medio_tecnico_articulado_percentual') {
      for (const [auxKey, label] of [
        ['integrado', 'Matrículas integradas'],
        ['concomitante', 'Matrículas concomitantes'],
        ['articulado', 'Matrículas articuladas'],
      ]) {
        const years = clip(detail.aux.get(auxKey))
        if (years.size) {
          supports.push(label)
          periods.push(formatPeriod(years, 'anual'))
        }
      }
    } else {
      const totalYears = clip(detail.total)
      if (totalYears.size) {
        const title = key === 'eja_integrada_educacao_profissional_percentual'
          ? 'Histórico das matrículas da EJA articuladas à educação profissional'
          : `${isCensus ? 'Histórico' : 'Histórico de matrículas'} — ${detail.title || itemLabelFallback(key)}`
        supports.push(title)
        periods.push(formatPeriod(totalYears, isCensus ? 'censitária' : 'anual'))
      }
    }

    if (key !== 'eja_integrada_educacao_profissional_percentual' && key !== 'medio_tecnico_articulado_percentual') {
      const dependencyYears = clip(detail.dependencia)
      if (dependencyYears.size) {
        supports.push('Dependência administrativa (federal, estadual, municipal e privada, conforme disponibilidade)')
        periods.push(formatPeriod(dependencyYears, 'anual'))
      }
    }

    const componentYears = clip(detail.componentsByCycle.get(cycle) ?? detail.components)
    if (componentYears.size) {
      const numerator = detail.calculation?.numerator_label ?? 'numerador'
      const denominator = detail.calculation?.denominator_label ?? 'denominador'
      supports.push(`Dados usados no cálculo — ${numerator} e ${denominator}`)
      periods.push(formatPeriod(componentYears, isCensus ? 'censitária' : 'anual'))
    }
  }

  if (cycle === 'pne_2026_2036') {
    const projection = projectionAgg.get(key)
    if (projection?.available) {
      supports.push('Projeção tendencial (estimativa para planejamento)')
      const historical = formatPeriod(projection.historical, 'anual')
      const projected = formatPeriod(projection.projected, 'estimada')
      periods.push(`${historical} observado; ${projected}`)
    }
  }

  const observation = supports.some((support) => support.startsWith('Dependência administrativa')) && privateAvailableSince
    ? `Na aba de dependência administrativa, a plataforma também pode exibir o recorte de rede privada conveniada sob responsabilidade municipal; disponível desde ${privateAvailableSince}.`
    : ''

  return {
    labels: supports.length ? supports.map((label) => `• ${label}`).join('\n') : 'Nenhum apoio adicional exibido na base atual',
    periods: periods.length ? periods.map((period) => `• ${period}`).join('\n') : 'Não se aplica',
    observation,
  }
}

function itemLabelFallback(key) {
  return String(key).replace(/_/g, ' ')
}

function mergeDetailAggregate(target, detail) {
  if (!target.title && detail.title) target.title = detail.title
  if (!target.subtitle && detail.subtitle) target.subtitle = detail.subtitle
  if (!target.unit && detail.unit) target.unit = detail.unit
  if (!target.source && (detail.source || detail.fonte)) target.source = detail.source || detail.fonte
  if (!target.methodologyNote && (detail.methodology_note || detail.methodology)) {
    target.methodologyNote = detail.methodology_note || detail.methodology
  }
  if (!target.calculation && detail.calculation) target.calculation = detail.calculation
  addYearsFromRows(target.total, detail.series_total)
  addYearsFromRows(target.dependencia, detail.series_dependencia)
  addYearsFromRows(target.components, detail.series_components)
  for (const [cycle, rows] of Object.entries(detail.series_components_by_cycle ?? {})) {
    addYearsFromRows(ensureSet(target.componentsByCycle, cycle), rows)
  }
  for (const [auxKey, rows] of Object.entries(detail.series_auxiliares ?? {})) {
    addYearsFromRows(ensureSet(target.aux, auxKey), rows)
  }
}

function newDetailAggregate() {
  return {
    title: '', subtitle: '', unit: '', source: '', methodologyNote: '', calculation: null,
    total: new Set(), dependencia: new Set(), components: new Set(), componentsByCycle: new Map(), aux: new Map(),
  }
}

function addProjectionAggregate(map, key, projection) {
  if (!projection || projection.available !== true) return
  if (!map.has(key)) map.set(key, { available: true, historical: new Set(), projected: new Set(), method: '' })
  const agg = map.get(key)
  agg.available = true
  if (!agg.method && projection.method) agg.method = projection.method
  for (const year of projection.historical_years ?? []) addYear(agg.historical, year)
  for (const year of projection.years ?? []) addYear(agg.projected, year)
}

const [
  indicadores,
  education,
  pne2014RefsModule,
  pne2026RefsModule,
  pne2014TextsModule,
  pne2026TextsModule,
  sourceNotesModule,
  financialMetadataModule,
  fundebModule,
  pnateModule,
] = await Promise.all([
  readJson('public/data/indicadores.json'),
  importEducationCatalog(),
  importLocal('src/data/pne2014IndicatorGoalRefs.js'),
  importLocal('src/data/pne2026IndicatorGoalRefs.js'),
  importLocal('src/data/pne2014GoalTexts.js'),
  importLocal('src/data/pne2026GoalTexts.js'),
  importLocal('src/utils/dataSourceNotes.js'),
  importLocal('src/data/financialIndicatorMetadata.js'),
  importLocal('src/data/fundebIndicators.js'),
  importLocal('src/data/pnateIndicators.js'),
])

const siopeCatalog = await readJson('public/data/educacao/siope/siope_indicadores_dashboard_catalogo.json')
const siopeCoverage = await readJson('public/data/educacao/siope/siope_indicadores_dashboard_cobertura.json')

const pnePeriods = new Map()
const projectionAgg = new Map()
const fundebPeriods = new Map()
const pnatePeriods = new Map()
const detailAgg = new Map()
let privateAvailableSince = null

const municipalityDirs = await fs.readdir(path.join(root, 'public', 'data', 'municipios'), { withFileTypes: true })
for (const dirent of municipalityDirs) {
  if (!dirent.isDirectory()) continue
  const dir = path.join(root, 'public', 'data', 'municipios', dirent.name)
  let index
  try {
    index = JSON.parse(await fs.readFile(path.join(dir, 'index.json'), 'utf8'))
  } catch {
    continue
  }

  for (const cycle of ['pne_2014_2024', 'pne_2026_2036']) {
    for (const [key, result] of Object.entries(index?.[cycle]?.indicadores ?? {})) {
      addYearsFromRows(ensureNestedSet(pnePeriods, cycle, key), result?.series)
      addYear(ensureNestedSet(pnePeriods, cycle, key), result?.start_year)
      addYear(ensureNestedSet(pnePeriods, cycle, key), result?.end_year)
    }
  }
  for (const [key, projection] of Object.entries(index?.pne_2026_2036?.projecoes ?? {})) {
    addProjectionAggregate(projectionAgg, key, projection)
  }

  for (const [moduleKey, targetMap] of [['fundeb', fundebPeriods], ['pnate', pnatePeriods]]) {
    for (const row of index?.blocos?.[moduleKey]?.historico ?? []) {
      const year = row?.ano ?? row?.ano_fundeb
      for (const [key, value] of Object.entries(row ?? {})) {
        if (key === 'ano' || key === 'ano_fundeb') continue
        if (value !== null && value !== undefined && value !== '') addYear(ensureSet(targetMap, key), year)
      }
    }
  }

  try {
    const details = JSON.parse(await fs.readFile(path.join(dir, 'details.json'), 'utf8'))
    const availableSince = Number(details?._shared?.privadas_conveniadas?.disponivel_desde)
    if (Number.isFinite(availableSince)) {
      privateAvailableSince = privateAvailableSince == null ? availableSince : Math.min(privateAvailableSince, availableSince)
    }
    for (const [key, detail] of Object.entries(details ?? {})) {
      if (key.startsWith('_') || !detail || typeof detail !== 'object') continue
      if (!detailAgg.has(key)) detailAgg.set(key, newDetailAggregate())
      mergeDetailAggregate(detailAgg.get(key), detail)
    }
  } catch {
    // Some exports may omit the detail partition; the main catalog remains usable.
  }
}

const educationPeriods = new Map()
const systemSPeriods = new Map()
const educationFiles = await fs.readdir(path.join(root, 'public', 'data', 'educacao', 'municipios'), { withFileTypes: true })
for (const dirent of educationFiles) {
  if (!dirent.isFile() || !dirent.name.endsWith('.json')) continue
  let payload
  try {
    payload = JSON.parse(await fs.readFile(path.join(root, 'public', 'data', 'educacao', 'municipios', dirent.name), 'utf8'))
  } catch {
    continue
  }
  for (const indicator of education.EDUCATION_BASE_INDICATOR_CATALOG) {
    const block = payload?.blocos?.[indicator.dataBlock]
    const rows = collectPathYearRows(block, indicator.seriesPath)
    addYearsFromRows(ensureSet(educationPeriods, indicator.key), rows)
  }
  for (const key of ['total_escolas', 'matriculas', 'turmas', 'docentes']) {
    addYearsFromRows(ensureSet(systemSPeriods, key), payload?.blocos?.sistema_s?.series?.[key])
  }
}

const sectionLabel = (key) => education.EDUCATION_SECTION_LABELS[key] ?? key
const groupLabels = new Map()
for (const groups of Object.values(education.EDUCATION_SECTION_GROUPS ?? {})) {
  for (const group of groups ?? []) {
    for (const key of group.indicatorKeys ?? []) groupLabels.set(key, group.label)
  }
}

const sourceCatalog = new Map(education.EDUCATION_SOURCE_CATALOG.map((item) => [item.key, item]))

const PNE_2014_REFS = pne2014RefsModule.PNE_2014_INDICATOR_GOAL_REFS
const PNE_2026_REFS = pne2026RefsModule.PNE_2026_INDICATOR_GOAL_REFS
const PNE_2026_PENDING = new Set(pne2026RefsModule.PNE_2026_PENDING_GOAL_REFS)
const PNE_2014_TEXTS = pne2014TextsModule.PNE_2014_GOAL_TEXTS
const PNE_2026_TEXTS = pne2026TextsModule.PNE_2026_GOAL_TEXTS

const pneRows = []
for (const [cycle, cycleCatalog] of Object.entries(indicadores.cycles)) {
  const is2014 = cycle === 'pne_2014_2024'
  const goalRefs = is2014 ? PNE_2014_REFS : PNE_2026_REFS
  const goalTexts = is2014 ? PNE_2014_TEXTS : PNE_2026_TEXTS
  for (const category of cycleCatalog.categories ?? []) {
    for (const item of category.items ?? []) {
      const key = item.key
      const mainYears = pnePeriods.get(cycle)?.get(key) ?? new Set()
      const goalId = goalRefs[key]
      const goal = goalId ? goalTexts[goalId] : null
      const detail = detailAgg.get(key)
      const { source, methodology } = sourceNotesModule.getDataSourceParts({
        block: 'pne', cycle, indicatorKey: key, item, details: detail, source: item.source,
      })
      const support = buildSupportData({ cycle, key, mainYears, detailAgg, projectionAgg, privateAvailableSince })
      const type = item.tracks_goal === false || !goalId ? 'Indicador informativo / contextual' : 'Indicador de acompanhamento do PNE'
      const metaRelated = goalId
        ? `Meta ${goalId}${goal?.shortTitle ? ` — ${goal.shortTitle}` : ''}`
        : PNE_2026_PENDING.has(key)
          ? 'Associação com meta legal pendente no catálogo'
          : 'Sem meta específica associada na plataforma'
      const metaText = goal?.originalText ?? goal?.displayText ?? goal?.dashboardText ?? 'Não se aplica'
      const notes = [support.observation]
      if (item.tracks_goal === false || !goalId) notes.push('Visualização informativa/contextual; não representa, isoladamente, cumprimento de meta legal.')
      if (PNE_2026_PENDING.has(key)) notes.push('A associação jurídica com uma meta específica ainda não está confirmada no catálogo da plataforma.')
      if (key === 'medio_tecnico_articulado_percentual') notes.push('Indicador aproximado: considera cursos técnicos integrados; matrículas concomitantes aparecem somente no aprofundamento.')
      if (CENSUS_KEYS.has(key)) notes.push('Indicador censitário; não constitui série anual municipal.')
      if (POPULATION_ATTENDANCE_KEYS.has(key)) notes.push('Cobertura estimada; valores acima de 100% podem ocorrer por estimativas populacionais, mobilidade escolar e oferta localizada no município.')
      const projection = projectionAgg.get(key)
      if (projection?.method && cycle === 'pne_2026_2036') notes.push(`Projeção: ${projection.method}.`)

      pneRows.push([
        cycleCatalog.label,
        category.label,
        type,
        key,
        item.label,
        item.desc || item.sub || '',
        metaRelated,
        metaText,
        buildPneConstruction(item, detail, methodology || detail?.methodologyNote),
        formatPeriod(mainYears),
        support.labels,
        support.periods,
        source || item.source || 'Fonte não explicitada para este indicador',
        sourceUrlsForPne(key, item, cycle),
        joinNotes(notes),
      ])
    }
  }
}

const educationRows = []
for (const indicator of education.EDUCATION_INDICATOR_CATALOG) {
  const sourceMeta = sourceCatalog.get(indicator.source)
  const sections = (indicator.sections ?? [indicator.section]).map(sectionLabel).join('; ')
  const type = indicator.type === 'complementary' ? 'Indicador complementar do PNE' : 'Indicador educacional'
  const pneComplementaryPeriod = pnePeriods.get('pne_2026_2036')?.get(indicator.key)
  const periodSet = indicator.type === 'complementary'
    ? pneComplementaryPeriod?.size
      ? pneComplementaryPeriod
      : detailAgg.get(indicator.key)?.total ?? new Set()
    : educationPeriods.get(indicator.key) ?? new Set()
  const notes = []
  if (indicator.type === 'complementary') notes.push('Indicador contextual: não exibe distância, status de meta ou projeção e não representa cumprimento de meta legal.')
  if (indicator.key === 'mat-profissional' || indicator.key === 'oferta-total') {
    notes.push(education.EDUCATION_INDICATOR_COMPARISON_GROUPS['educacao-profissional'].note)
  }
  educationRows.push([
    sections,
    groupLabels.get(indicator.key) ?? sectionLabel(indicator.section),
    type,
    indicator.key,
    indicator.label,
    indicator.description,
    'Não se aplica — página fora dos ciclos do PNE',
    'Não se aplica',
    `${indicator.description} A plataforma lê o campo “${indicator.seriesPath}” do bloco “${indicator.dataBlock}” e apresenta a medida em ${indicator.unit}.`,
    formatPeriod(periodSet, sourceMeta?.periodicity ?? ''),
    'Não se aplica',
    'Não se aplica',
    sourceMeta?.officialName ?? indicator.source,
    sourceUrlsForEducation(indicator.source),
    joinNotes(notes),
  ])
}

for (const demandIndicator of education.EDUCATION_DEMAND_INDICATOR_CATALOG) {
  const projection = projectionAgg.get(demandIndicator.key)
  const group = education.EDUCATION_DEMAND_GROUP_CATALOG.find((item) => item.indicatorKeys.includes(demandIndicator.key))
  const historical = projection?.historical ?? new Set()
  const projected = projection?.projected ?? new Set()
  educationRows.push([
    sectionLabel(education.EDUCATION_SECTION_KEYS.demand),
    group?.label ?? 'Demanda e projeções',
    'Cenário estimado de atendimento',
    `demanda-${demandIndicator.key}`,
    demandIndicator.title,
    `Cenário de atendimento para a faixa de ${demandIndicator.ageRange}, com população de referência por faixa etária.`,
    'Não se aplica — cenário de planejamento',
    'Não se aplica',
    'Combina o histórico municipal disponível do percentual de atendimento com a população de referência por faixa etária e projeta um cenário estimado até 2036, com suavização e limites plausíveis por indicador.',
    `${formatPeriod(historical, 'anual')} observado; ${formatPeriod(projected, 'estimada')}`,
    'Não se aplica',
    'Não se aplica',
    demandIndicator.source,
    `${URLS.censoEscolar}\n${URLS.estimativasPopulacionais}`,
    'Cenário estimado para planejamento; não constitui previsão oficial nem cálculo direto de déficit de vagas. Matrículas localizadas no território não representam necessariamente a residência dos estudantes.',
  ])
}

const systemSConfigs = [
  ['total_escolas', 'Escolas do Sistema S', 'Total de escolas mantidas pelo Sistema S no município.'],
  ['matriculas', 'Matrículas nas escolas do Sistema S', 'Total de matrículas nas escolas do Sistema S.'],
  ['turmas', 'Turmas nas escolas do Sistema S', 'Total de turmas nas escolas do Sistema S.'],
  ['docentes', 'Docentes nas escolas do Sistema S', 'Total de docentes vinculados às escolas do Sistema S.'],
]
for (const [key, label, description] of systemSConfigs) {
  educationRows.push([
    sectionLabel(education.EDUCATION_SECTION_KEYS.modalities),
    'Sistema S',
    'Indicador educacional — Sistema S',
    `sistema_s.${key}`,
    label,
    description,
    'Não se aplica — página fora dos ciclos do PNE',
    'Não se aplica',
    `${description} A série anual é lida do bloco “sistema_s.series.${key}”.`,
    formatPeriod(systemSPeriods.get(key), 'anual'),
    'Distribuição de matrículas por etapa e lista de escolas, quando disponíveis',
    formatPeriod(systemSPeriods.get('matriculas'), 'anual'),
    'Censo Escolar da Educação Básica — INEP',
    URLS.censoEscolar,
    'Parte das matrículas pode estar vinculada a unidades EAD ou sedes regionais declaradas no município.',
  ])
}

const financeRows = []
const FINANCIAL_METADATA = financialMetadataModule.FINANCIAL_INDICATOR_METADATA
const siopeBySlug = new Map(siopeCatalog.indicadores.map((item) => [item.slug, item]))
for (const [key, meta] of Object.entries(FINANCIAL_METADATA.siope)) {
  const catalog = siopeBySlug.get(key) ?? {}
  const incomplete = (siopeCoverage.indicadores_selecionados_com_cobertura_incompleta ?? []).filter((item) => item.slug === key)
  const incompleteNote = incomplete.length
    ? `Há cobertura incompleta em ${[...new Set(incomplete.map((item) => item.ano))].join(', ')}; consultar o aviso de disponibilidade da plataforma.`
    : ''
  financeRows.push([
    'Financiamento e Execução dos Recursos da Educação',
    catalog.grupo_dashboard ?? 'SIOPE',
    'Indicador financeiro — SIOPE',
    catalog.codigo_indicador ?? key,
    catalog.nome_dashboard ?? key,
    meta.definition,
    'Referência legal/financeira, quando aplicável',
    meta.referenceRule,
    meta.calculation,
    `${catalog.primeira_ocorrencia_ano ?? 2021}–${catalog.ultima_ocorrencia_ano ?? 2025}; 6º bimestre de cada ano`,
    'Não se aplica',
    'Não se aplica',
    meta.financingSource,
    URLS.siope,
    joinNotes([meta.methodNote, catalog.observacao, incompleteNote]),
  ])
}

const fundebByKey = new Map(fundebModule.FUNDEB_INDICATORS.map((item) => [item.key, item]))
for (const [key, meta] of Object.entries(FINANCIAL_METADATA.fundeb)) {
  const indicator = fundebByKey.get(key) ?? {}
  financeRows.push([
    'FUNDEB',
    'Receitas, despesas, remuneração e saldos',
    'Indicador financeiro — FUNDEB',
    key,
    indicator.label ?? key,
    indicator.description ?? meta.definition,
    'Referência legal/financeira, quando aplicável',
    meta.referenceRule,
    meta.calculation,
    formatPeriod(fundebPeriods.get(key), 'anual'),
    'Não se aplica',
    'Não se aplica',
    meta.financingSource,
    `${URLS.fundeb}\n${URLS.leiFundeb}`,
    meta.methodNote,
  ])
}

const pnateByKey = new Map(pnateModule.PNATE_INDICATORS.map((item) => [item.key, item]))
for (const [key, meta] of Object.entries(FINANCIAL_METADATA.pnate)) {
  const indicator = pnateByKey.get(key) ?? {}
  financeRows.push([
    'PNATE',
    'Transporte escolar rural, estudantes e repasses',
    'Indicador financeiro — PNATE',
    key,
    indicator.label ?? key,
    indicator.description ?? meta.definition,
    'Regra do programa, quando aplicável',
    meta.referenceRule,
    meta.calculation,
    formatPeriod(pnatePeriods.get(key), 'anual'),
    'Não se aplica',
    'Não se aplica',
    meta.financingSource,
    URLS.pnate,
    meta.methodNote,
  ])
}

const vaarLabels = {
  habilitado_condicionalidades: 'Habilitação nas condicionalidades',
  recebe_aprendizagem: 'Recebimento do componente de aprendizagem',
  recebe_atendimento: 'Recebimento do componente de atendimento',
  indicador_aprendizagem: 'Indicador de aprendizagem',
  indicador_atendimento: 'Indicador de atendimento',
  coeficiente_total: 'Coeficiente de distribuição total',
  proporcao_abandono: 'Proporção de abandono',
  proporcao_sem_informacao: 'Proporção sem informação de rendimento/movimento',
}
for (const [key, meta] of Object.entries(FINANCIAL_METADATA.vaar)) {
  financeRows.push([
    'Complementação VAAR',
    key.includes('aprendizagem') ? 'Aprendizagem com equidade' : key.includes('atendimento') || key.includes('abandono') || key.includes('informacao') ? 'Atendimento' : 'Condicionalidades e distribuição',
    'Indicador financeiro/educacional — VAAR',
    key,
    vaarLabels[key] ?? key,
    meta.definition,
    'Regra anual do VAAR, quando aplicável',
    meta.referenceRule,
    meta.calculation,
    '2023–2026; componentes e anos-base variam conforme a metodologia do exercício',
    'Não se aplica',
    'Não se aplica',
    meta.financingSource,
    `${URLS.fundeb}\n${URLS.leiFundeb}`,
    meta.methodNote,
  ])
}

function styleSheet(sheet, rows, title, subtitle, tableName) {
  const lastRow = 5 + rows.length
  sheet.showGridLines = false
  sheet.mergeCells('A1:O1')
  sheet.getRange('A1').values = [[title]]
  sheet.getRange('A1:O1').format = {
    fill: '#0B1F3A',
    font: { name: 'Aptos Display', size: 18, bold: true, color: '#FFFFFF' },
    verticalAlignment: 'center',
  }
  sheet.getRange('A1:O1').format.rowHeight = 34

  sheet.mergeCells('A2:L2')
  sheet.getRange('A2').values = [[subtitle]]
  sheet.getRange('A2:L2').format = {
    fill: '#E8F1F5',
    font: { name: 'Aptos', size: 10, color: '#24465C' },
    wrapText: true,
    verticalAlignment: 'center',
  }
  sheet.mergeCells('M2:N2')
  sheet.getRange('M2').values = [['Total de indicadores']]
  sheet.getRange('M2:N2').format = {
    fill: '#D7ECE8',
    font: { name: 'Aptos', size: 10, bold: true, color: '#0F5132' },
    horizontalAlignment: 'right',
    verticalAlignment: 'center',
  }
  sheet.getRange('O2').formulas = [[`=COUNTA(D6:D${lastRow})`]]
  sheet.getRange('O2').format = {
    fill: '#0F766E',
    font: { name: 'Aptos Display', size: 13, bold: true, color: '#FFFFFF' },
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
    numberFormat: '0',
  }
  sheet.getRange('A2:O2').format.rowHeight = 32

  sheet.mergeCells('A3:O3')
  sheet.getRange('A3').values = [[
    'Períodos refletem a cobertura observada nos arquivos atuais da plataforma e podem variar por município. “Sem série disponível” não significa valor zero.',
  ]]
  sheet.getRange('A3:O3').format = {
    fill: '#FFF4D6',
    font: { name: 'Aptos', size: 9, italic: true, color: '#6B4F00' },
    wrapText: true,
    verticalAlignment: 'center',
  }
  sheet.getRange('A3:O3').format.rowHeight = 28

  sheet.getRange('A5:O5').values = [HEADERS]
  if (rows.length) sheet.getRange(`A6:O${lastRow}`).values = rows
  sheet.getRange(`A5:O${lastRow}`).format.font = { name: 'Aptos', size: 9, color: '#1F2937' }
  sheet.getRange('A5:O5').format = {
    fill: '#24465C',
    font: { name: 'Aptos', size: 9, bold: true, color: '#FFFFFF' },
    wrapText: true,
    verticalAlignment: 'center',
    horizontalAlignment: 'left',
    borders: { bottom: { style: 'medium', color: '#0F766E' } },
  }
  sheet.getRange('A5:O5').format.rowHeight = 42
  const body = sheet.getRange(`A6:O${lastRow}`)
  body.format = {
    wrapText: true,
    verticalAlignment: 'top',
    borders: { insideHorizontal: { style: 'thin', color: '#D8E1E7' } },
  }
  body.format.rowHeight = 66

  const table = sheet.tables.add(`A5:O${lastRow}`, true, tableName)
  table.style = 'TableStyleMedium2'
  table.showBandedRows = false
  table.showFilterButton = true
  sheet.getRange('A4:O4').format.fill = '#FFFFFF'
  const wrappedColumnWidths = new Map([[5, 42], [6, 30], [7, 52], [8, 52], [10, 52], [11, 36], [12, 42], [13, 42], [14, 48]])
  for (let row = 6; row <= lastRow; row += 1) {
    const rowRange = sheet.getRange(`A${row}:O${row}`)
    rowRange.format.fill = row % 2 === 0 ? '#E7F4F8' : '#FFFFFF'
    const rowData = rows[row - 6]
    let estimatedLines = 1
    for (const [columnIndex, width] of wrappedColumnWidths) {
      const text = String(rowData?.[columnIndex] ?? '')
      const lines = text.split('\n').reduce(
        (sum, part) => sum + Math.max(1, Math.ceil(part.length / (width * 1.15))),
        0,
      )
      estimatedLines = Math.max(estimatedLines, lines)
    }
    rowRange.format.rowHeight = Math.min(150, Math.max(66, estimatedLines * 12 + 8))
  }

  const widths = [24, 24, 21, 23, 34, 42, 30, 52, 52, 24, 52, 36, 42, 42, 48]
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, lastRow, 1).format.columnWidth = width
  })
  sheet.getRange(`A6:D${lastRow}`).format.verticalAlignment = 'top'
  sheet.getRange(`J6:J${lastRow}`).format.horizontalAlignment = 'center'
  sheet.freezePanes.freezeRows(5)
  sheet.freezePanes.freezeColumns(2)
}

const workbook = Workbook.create()
styleSheet(
  workbook.worksheets.add('PNEs'),
  pneRows,
  'Catálogo de indicadores — PNEs',
  'Inventário dos indicadores exibidos nos ciclos PNE 2014–2024 e PNE 2026–2036, incluindo metas, construção e dados de apoio.',
  'TabelaPNEs',
)
styleSheet(
  workbook.worksheets.add('Indicadores Educacionais'),
  educationRows,
  'Catálogo de indicadores — Indicadores Educacionais',
  'Indicadores-base, complementares, cenários de demanda e indicadores do Sistema S organizados pelas seções da página.',
  'TabelaEducacao',
)
styleSheet(
  workbook.worksheets.add('Financiamento'),
  financeRows,
  'Catálogo de indicadores — Financiamento',
  'Indicadores dos módulos SIOPE, FUNDEB, PNATE e Complementação VAAR, com cálculo, período, fonte e referências de leitura.',
  'TabelaFinanciamento',
)

await fs.mkdir(outputDir, { recursive: true })

const checks = {}
for (const [sheetName, rowCount] of [
  ['PNEs', pneRows.length],
  ['Indicadores Educacionais', educationRows.length],
  ['Financiamento', financeRows.length],
]) {
  checks[sheetName] = (await workbook.inspect({
    kind: 'table',
    range: `${sheetName}!A1:O${Math.min(12, rowCount + 5)}`,
    include: 'values,formulas',
    tableMaxRows: 12,
    tableMaxCols: 15,
    maxChars: 6000,
  })).ndjson
  const preview = await workbook.render({
    sheetName,
    range: `A1:O${Math.min(15, rowCount + 5)}`,
    scale: 1,
    format: 'png',
  })
  await fs.writeFile(
    path.join(outputDir, `preview-${sheetName.toLowerCase().replace(/\s+/g, '-')}.png`),
    new Uint8Array(await preview.arrayBuffer()),
  )
}

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 300 },
  summary: 'final formula error scan',
})

const xlsx = await SpreadsheetFile.exportXlsx(workbook)
await xlsx.save(outputPath)

const qa = {
  missingPeriods: {
    PNEs: pneRows.filter((row) => String(row[9]).startsWith('Sem série')).map((row) => row[3]),
    IndicadoresEducacionais: educationRows.filter((row) => String(row[9]).startsWith('Sem série')).map((row) => row[3]),
    Financiamento: financeRows.filter((row) => String(row[9]).startsWith('Sem série')).map((row) => row[3]),
  },
  blankConstruction: {
    PNEs: pneRows.filter((row) => !String(row[8]).trim()).map((row) => row[3]),
    IndicadoresEducacionais: educationRows.filter((row) => !String(row[8]).trim()).map((row) => row[3]),
    Financiamento: financeRows.filter((row) => !String(row[8]).trim()).map((row) => row[3]),
  },
  duplicateCodes: {
    PNEs: findDuplicates(pneRows.map((row) => `${row[0]}|${row[3]}`)),
    IndicadoresEducacionais: findDuplicates(educationRows.map((row) => row[3])),
    Financiamento: findDuplicates(financeRows.map((row) => `${row[0]}|${row[3]}`)),
  },
  selectedPeriods: Object.fromEntries(
    educationRows
      .filter((row) => ['apr-ideb', 'apr-saeb-lp', 'apr-alfabetizacao', 'apr-inse', 'demanda-creche', 'sistema_s.matriculas'].includes(row[3]))
      .map((row) => [row[3], row[9]]),
  ),
}

console.log(JSON.stringify({
  outputPath,
  rowCounts: { PNEs: pneRows.length, IndicadoresEducacionais: educationRows.length, Financiamento: financeRows.length },
  formulaErrors: errors.ndjson,
  qa,
  checkSamples: Object.fromEntries(Object.entries(checks).map(([key, value]) => [key, value.slice(0, 800)])),
}, null, 2))

function findDuplicates(values) {
  const counts = new Map()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value)
}
