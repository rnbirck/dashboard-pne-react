import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const output = mkdtempSync(path.join(tmpdir(), 'dashboard-pne-education-'))
execFileSync(process.execPath, [
  path.resolve('node_modules/typescript/bin/tsc'),
  '--project',
  'scripts/checks/tsconfig.education.json',
  '--outDir',
  output,
], { stdio: 'inherit' })
process.on('exit', () => rmSync(output, { force: true, recursive: true }))

const moduleUrl = (relativePath) => pathToFileURL(path.join(output, relativePath)).href
const selectors = await import(moduleUrl('src/features/education/educationSelectors.js'))
const viewModels = await import(moduleUrl('src/features/education/educationViewModels.js'))
const formatters = await import(moduleUrl('src/features/education/educationFormatters.js'))
const attendancePresentation = await import(moduleUrl('src/features/education/educationAttendancePresentation.js'))
const attendanceFilters = await import(moduleUrl('src/features/education/educationAttendanceFilters.js'))
const overviewPresentation = await import(moduleUrl('src/features/education/municipalEducationOverviewPresentation.js'))
const overviewLoader = await import(moduleUrl('src/data/municipalEducationOverview.js'))
const projectionEndLabels = await import(pathToFileURL(path.resolve('src/utils/projectionEndLabels.js')).href)

const indicators = [
  { key: 'b', label: 'Zeta', description: 'Atendimento escolar', themeLabel: 'Matrículas' },
  { key: 'a', label: 'Álfa', description: 'Trajetória', categoryLabel: 'Fluxo' },
]

test('visão geral municipal preserva zero, ausência e contrato ampliado', () => {
  const base = { year: 2025, sourceId: 'inep', sourceField: 'campo' }
  assert.equal(overviewPresentation.formatSchoolPerformanceRate({ ...base, state: 'observed', value: 0 }), '0,0%')
  assert.equal(overviewPresentation.formatSchoolPerformanceRate({ ...base, state: 'unavailable', value: null }), '—')
  assert.equal(overviewPresentation.formatSchoolPerformanceRate({ ...base, state: 'not_applicable', value: null }), '—')
  assert.equal(overviewLoader.isMunicipalEducationOverviewDocument({
    schemaVersion: 'municipal-education-overview-v1',
    municipality: { idMunicipality: '4319356', name: 'São Pedro da Serra', slug: 'sao-pedro-da-serra' },
    reference: { year: 2025, generatedAt: '2026-07-22T12:00:00-03:00' },
    basicEducationComposition: { components: {} },
    highSchool: { total: { byNetwork: {}, bySchoolLocation: {} }, integratedTechnical: {} },
    specialEducation: {},
    schoolPerformance: { referenceYear: 2025 },
    enrollmentComparison: { years: [2015, 2025], stages: {} },
  }, '4319356'), true)
})

test('agrupa itens na ordem declarada da seção', () => {
  assert.deepEqual(
    selectors.selectEducationSectionItems(indicators, { key: 'x', indicatorKeys: ['a', 'b', 'inexistente'] }).map((item) => item.key),
    ['a', 'b'],
  )
  assert.deepEqual(
    selectors.selectEducationVisibleGroups([{ key: 'g', indicatorKeys: ['b', 'inexistente'] }], indicators)[0].items.map((item) => item.key),
    ['b'],
  )
})

test('busca normalizada, filtragem e ordenação preservam o contrato', () => {
  assert.equal(selectors.normalizeEducationSearch('  ÁLFA  '), 'álfa')
  assert.deepEqual(selectors.filterEducationIndicators(indicators, 'trajetória').map((item) => item.key), ['a'])
  assert.deepEqual(selectors.sortEducationIndicators(indicators).map((item) => item.key), ['a', 'b'])
})

test('indisponibilidade, zero e seleção de detalhe são distintos', () => {
  assert.equal(selectors.isEducationIndicatorAvailable(0), true)
  assert.equal(selectors.isEducationIndicatorAvailable(null), false)
  assert.equal(selectors.isEducationIndicatorAvailable(undefined), false)
  assert.equal(selectors.selectActiveEducationIndicator(indicators, 'a')?.label, 'Álfa')
  assert.equal(selectors.selectActiveEducationIndicator(indicators, 'inexistente'), null)
})

test('view model resolve seção e resumo sem alterar dados', () => {
  const sections = { overview: 'overview', demand: 'demand', methodology: 'methodology' }
  assert.deepEqual(
    viewModels.buildEducationPageViewModel({ sectionItemCount: 0, selectedSectionKey: 'demand', sectionKeys: sections }),
    { contextScope: 'Cenários de atendimento escolar', isDemandSection: true, isMethodologySection: false, isOverviewSection: false },
  )
  assert.equal(
    viewModels.buildEducationPageViewModel({ sectionItemCount: 1, selectedSectionKey: 'overview', sectionKeys: sections }).contextScope,
    '1 indicador',
  )
})

test('indicadores de infraestrutura expõem recortes por rede e localização', () => {
  const rede = {
    infraestrutura: {
      por_rede: [
        { ano: 2025, dependencia: 'municipal', perc_tablet_aluno: 38.2 },
        { ano: 2025, dependencia: 'estadual', perc_tablet_aluno: 51.4 },
      ],
      por_localizacao: [
        { ano: 2025, localizacao: 'urbana', perc_tablet_aluno: 40.1 },
        { ano: 2025, localizacao: 'rural', perc_tablet_aluno: 87.5 },
      ],
    },
  }
  const theme = viewModels.buildPneComplementaryTheme({
    indicadores: null,
    results: {
      tablet_aluno: {
        end_value: 42.5,
        end_year: 2025,
        series: [{ ano: 2019, valor: 16 }, { ano: 2025, valor: 42.5 }],
        value_mode: 'percent',
      },
    },
    rede,
  })
  const tablet = theme?.items.find((item) => item.key === 'tablet_aluno')

  assert.deepEqual(tablet?.explore.map((item) => item.key), [
    'tablet_aluno-por-rede',
    'tablet_aluno-por-localizacao',
  ])
  assert.deepEqual(tablet?.explore.map((item) => item.chartSize), ['large', 'large'])
  assert.equal(tablet?.statusLabel, 'Crescimento')
  assert.equal(tablet?.statusDetail, 'Aumento entre 2019 e 2025')
  assert.deepEqual(tablet?.explore[0].data, [
    { label: 'Municipal', value: 38.2, year: 2025 },
    { label: 'Estadual', value: 51.4, year: 2025 },
  ])
  assert.deepEqual(tablet?.explore[1].data, [
    { label: 'Urbana', value: 40.1, year: 2025 },
    { label: 'Rural', value: 87.5, year: 2025 },
  ])
})

test('indicadores contextuais descrevem o movimento observado da série', () => {
  const theme = viewModels.buildPneComplementaryTheme({
    indicadores: null,
    results: {
      internet: { end_value: 98.8, end_year: 2025, series: [{ ano: 2015, valor: 91.4 }, { ano: 2025, valor: 98.8 }], value_mode: 'percent' },
      rede_local: { end_value: 80, end_year: 2025, series: [{ ano: 2019, valor: 90 }, { ano: 2025, valor: 80 }], value_mode: 'percent' },
      rede_wireless: { end_value: 60, end_year: 2025, series: [{ ano: 2019, valor: 60 }, { ano: 2025, valor: 60 }], value_mode: 'percent' },
      tablet_aluno: { end_value: 42.5, end_year: 2025, series: [{ ano: 2025, valor: 42.5 }], value_mode: 'percent' },
    },
  })
  const statusByKey = Object.fromEntries(theme?.items.map((item) => [item.key, item.statusLabel]) ?? [])

  assert.equal(statusByKey.internet, 'Crescimento')
  assert.equal(statusByKey.rede_local, 'Redução')
  assert.equal(statusByKey.rede_wireless, 'Estabilidade')
  assert.equal(statusByKey.tablet_aluno, 'Série disponível')
  assert.equal(theme?.items.some((item) => item.statusLabel === 'Contexto'), false)
})

test('navegação educacional resolve seção, detalhe e vizinhança compartilhada', () => {
  assert.deepEqual(
    selectors.getInitialEducationNavigation({
      route: 'educacao',
      hashParams: 'secao=trajetoria&detalhe=fluxo-aprovacao',
      searchParams: '',
    }),
    {
      panoramaTheme: 'fluxo',
      section: 'trajetoria',
      detailKey: 'fluxo-aprovacao',
      shouldApplyTheme: true,
    },
  )
  assert.deepEqual(
    selectors.getInitialEducationNavigation({ route: 'outra-rota' }),
    {
      panoramaTheme: 'matriculas',
      section: 'visao-geral',
      detailKey: '',
      shouldApplyTheme: false,
    },
  )

  const sequence = selectors.selectEducationDetailSequence(indicators, 'a')
  assert.equal(sequence.activeIndex, 1)
  assert.equal(sequence.previousItem?.key, 'b')
  assert.equal(sequence.nextItem, null)
})

test('cards principais preservam zero, ausência, percentuais e série insuficiente', () => {
  const zero = viewModels.createIndicator({
    key: 'fixture-zero',
    label: 'Zero observado',
    themeKey: 'matriculas',
    categories: ['todos'],
    series: [{ ano: 2025, valor: 0 }],
    currentValue: 0,
    formatType: 'number',
  })
  assert.equal(zero.currentDisplay, '0')
  assert.equal(zero.statusLabel, 'Com dados')
  assert.equal(zero.series.length, 1)

  const missing = viewModels.createIndicator({
    key: 'fixture-missing',
    label: 'Ausente',
    themeKey: 'matriculas',
    categories: ['todos'],
    series: [],
    currentValue: null,
    formatType: 'number',
  })
  assert.equal(missing.currentDisplay, '—')
  assert.equal(missing.statusLabel, 'Sem dados')

  const percent = viewModels.createIndicator({
    key: 'fixture-percent',
    label: 'Percentual',
    themeKey: 'fluxo',
    categories: ['todos'],
    series: [{ ano: 2020, valor: 10 }, { ano: 2025, valor: 12 }],
    currentValue: 12,
    formatType: 'percent',
  })
  assert.equal(percent.currentDisplay, '12,0%')
  assert.equal(percent.variationDisplay, '+2 p.p.')
  assert.equal(percent.statusLabel, 'Alta')
})

test('projeção preserva alinhamento entre ano, ausência e população', () => {
  const incompleteProjection = {
    historical_years: [2022, 2023, 2024],
    historical_percent: [51.2, 103.4, null],
    historical_population: [1000, 1010, 1020],
  }

  assert.deepEqual(
    viewModels.buildProjectionHistory({
      historical_years: [2022, 2023, 2024],
      historical_percent: [51.2, null, 54.8],
      historical_population: [1000, 1010, 1020],
    }),
    [
      { year: 2022, value: 51.2, population: 1000 },
      { year: 2023, value: null, population: 1010 },
      { year: 2024, value: 54.8, population: 1020 },
    ],
  )
  assert.deepEqual(
    viewModels.getLatestProjectionObservation(incompleteProjection),
    { year: 2023, value: 103.4, population: 1010 },
  )
  assert.equal(
    viewModels.getLatestProjectionObservation({
      historical_years: [2023, 2024],
      historical_percent: [null, null],
      historical_population: [1010, 1020],
    }),
    null,
  )
  assert.deepEqual(viewModels.buildProjectionHistory(null), [])
})

test('formatadores educacionais preservam fontes, períodos e nomes oficiais', () => {
  assert.equal(formatters.formatIndicatorCount(0), '0 indicadores')
  assert.equal(formatters.formatIndicatorCount(1), '1 indicador')
  assert.equal(formatters.formatSourceYears([]), 'Não disponível para o município')
  assert.equal(formatters.formatSourceYears([2019]), '2019')
  assert.equal(formatters.formatSourceYears([2019, 2021, 2023]), '2019–2023')
  assert.equal(formatters.normalizeEducationIndicatorLabel('Matrículas na EJA'), 'Matrículas na Educação de Jovens e Adultos')
  assert.equal(formatters.normalizeMethodologyId('Como interpretar'), 'como-interpretar')
})

test('busca considera caixa e acentuação declarada sem alterar a ordem de seção', () => {
  assert.deepEqual(selectors.filterEducationIndicators(indicators, '  TRAJETÓRIA ').map((item) => item.key), ['a'])
  assert.deepEqual(
    selectors.selectEducationSectionItems(indicators, { key: 'x', indicatorKeys: ['b', 'a'] }).map((item) => item.key),
    ['b', 'a'],
  )
})

test('regra de publicação usa valores brutos e exclui manutenção, constância e histórico isolado', () => {
  const indicator = {
    kind: 'age_coverage',
    observed: { year: 2025, numerator: 120, denominator: 100, rawValue: 120 },
    historical: [
      { year: 2024, numerator: 110, denominator: 100, rawValue: 110 },
      { year: 2025, numerator: 120, denominator: 100, rawValue: 120 },
    ],
    scenario: {
      type: 'trend_scenario',
      method: 'municipal_base_times_rs_age_factor',
      status: 'available',
      projected: [
        { year: 2026, numerator: 121, denominator: 100, rawValue: 121 },
        { year: 2036, numerator: 130, denominator: 100, rawValue: 130 },
      ],
    },
    reference: { value: 100, year: 2036 },
    diagnostics: { warnings: ['bases distintas'] },
  }

  assert.equal(attendancePresentation.isDisplayableProjection(indicator), true)
  assert.deepEqual(attendancePresentation.toProjectionView(indicator).projected_percent, [100, 100])
  assert.deepEqual(attendancePresentation.toProjectionView(indicator).raw_projected_percent, [121, 130])

  const constant = {
    ...indicator,
    scenario: {
      ...indicator.scenario,
      projected: [
        { year: 2026, rawValue: 120 },
        { year: 2036, rawValue: 120 },
      ],
    },
  }
  assert.equal(attendancePresentation.isDisplayableProjection(constant), false)
  assert.equal(attendancePresentation.isDisplayableProjection({
    ...indicator,
    scenario: { ...indicator.scenario, model: 'last_value' },
  }), false)
  assert.equal(attendancePresentation.isDisplayableProjection({
    ...indicator,
    scenario: { ...indicator.scenario, type: 'maintenance' },
  }), false)
  assert.equal(attendancePresentation.isDisplayableProjection({
    ...indicator,
    scenario: { ...indicator.scenario, projected: [] },
  }), false)
})

test('adaptador preserva projeção, meta explícita e diferença na unidade percentual', () => {
  const view = attendancePresentation.toProjectionView({
    kind: 'age_coverage',
    observed: { year: 2025, rawValue: 70 },
    historical: [{ year: 2024, rawValue: 65 }, { year: 2025, rawValue: 70 }],
    scenario: {
      type: 'trend_scenario',
      method: 'fixture',
      status: 'available',
      projected: [{ year: 2026, rawValue: 72 }, { year: 2036, rawValue: 85 }],
    },
    reference: { value: 90, year: 2036 },
    diagnostics: { warnings: [] },
  })
  assert.equal(view.available, true)
  assert.equal(view.projected_end_year, 2036)
  assert.equal(view.target_percent, 90)
  assert.equal(view.target_year, 2036)
  assert.equal(view.distance_to_target_2036, -5)
})

test('percentual de apresentação trata limite, piso, ausência e valor regular', () => {
  assert.deepEqual(attendancePresentation.toDisplayPercentage(102), {
    displayValue: 100,
    displayWasCapped: true,
    rawValue: 102,
  })
  assert.deepEqual(attendancePresentation.toDisplayPercentage(130.5), {
    displayValue: 100,
    displayWasCapped: true,
    rawValue: 130.5,
  })
  assert.deepEqual(attendancePresentation.toDisplayPercentage(-4), {
    displayValue: 0,
    displayWasCapped: false,
    rawValue: -4,
  })
  assert.deepEqual(attendancePresentation.toDisplayPercentage(null), {
    displayValue: null,
    displayWasCapped: false,
    rawValue: null,
  })
  assert.deepEqual(attendancePresentation.toDisplayPercentage(68.4), {
    displayValue: 68.4,
    displayWasCapped: false,
    rawValue: 68.4,
  })
})

function projectedAttendanceIndicator(indicatorKey, overrides = {}) {
  return {
    indicatorKey,
    kind: 'age_coverage',
    observed: { year: 2025, rawValue: 70 },
    historical: [{ year: 2024, rawValue: 68 }, { year: 2025, rawValue: 70 }],
    scenario: {
      type: 'trend_scenario',
      method: 'fixture',
      status: 'available',
      projected: [{ year: 2026, rawValue: 71 }, { year: 2036, rawValue: 80 }],
    },
    reference: null,
    diagnostics: { warnings: [] },
    ...overrides,
  }
}

test('tempo integral publicável mantém filtro e bloco derivados da mesma coleção', () => {
  const integral = projectedAttendanceIndicator('basico_integral', {
    kind: 'integral_coverage',
    reference: {
      targets: [{ type: 'configured_reference', value: 50, year: 2036 }],
      trajectory: [{ year: 2031, value: 35 }, { year: 2036, value: 50 }],
    },
    scenario: {
      type: 'maintenance',
      method: 'last_components',
      status: 'available',
      projected: [{ year: 2036, rawValue: 70 }],
    },
  })
  const payload = { ageCoverage: {}, integral: { overall: integral } }
  const items = attendanceFilters.getDisplayableAttendanceItems(payload)

  assert.equal(attendancePresentation.isDisplayableProjection(integral), true)
  assert.deepEqual(attendancePresentation.toProjectionView(integral).raw_projected_percent, [35, 50])
  assert.deepEqual(attendanceFilters.getAvailableIndicatorTypes(items), ['integral'])
  assert.equal(attendanceFilters.getVisibleAttendanceItems(items, 'integral', 'overall').length, 1)
})

test('recortes usam ordem fixa e faixas combinadas substituem abrangência geral', () => {
  const keys = [
    'obrigatoria_4_17',
    'basico_15_17',
    'escolar_6_14',
    'creche',
    'basico_6_17',
    'pre_escola',
    'infantil_0_5',
  ]
  const payload = {
    ageCoverage: Object.fromEntries(keys.map((key) => [key, projectedAttendanceIndicator(key)])),
    integral: { overall: null },
  }
  const items = attendanceFilters.getDisplayableAttendanceItems(payload)

  assert.deepEqual(attendanceFilters.getAvailableCuts(items, 'coverage'), [
    'all',
    'infantil',
    'fundamental',
    'medio',
    'combined',
  ])
  assert.equal(attendanceFilters.CUT_LABELS.combined, 'Faixas combinadas')
  assert.deepEqual(
    attendanceFilters.getVisibleAttendanceItems(items, 'coverage', 'combined').map((item) => item.indicator.indicatorKey),
    ['obrigatoria_4_17', 'basico_6_17'],
  )
})

test('grade de métricas acompanha uma, duas, três e quatro células reais', () => {
  assert.equal(attendanceFilters.getMetricGridClass(1), 'metric-grid--one')
  assert.equal(attendanceFilters.getMetricGridClass(2), 'metric-grid--two')
  assert.equal(attendanceFilters.getMetricGridClass(3), 'metric-grid--three')
  assert.equal(attendanceFilters.getMetricGridClass(4), 'metric-grid--four')
})

test('rótulos finais combinam somente pontos brutos coincidentes e afastam os demais', () => {
  const base = {
    chartHeight: 264,
    chartWidth: 640,
    lastProjectedPoint: { value: 100, x: 572, y: 38, year: 2036 },
    metaLine: { labelY: 52, value: 100, y: 38 },
    padding: { bottom: 44, left: 64, right: 68, top: 38 },
  }
  const combined = projectionEndLabels.buildProjectionEndLabelLayout({
    ...base,
    projectedRawValue: 100,
    targetRawValue: 100,
    targetYear: 2036,
  })
  assert.equal(combined.combined, true)
  assert.equal(combined.meta.hidden, true)

  const sameValueDifferentYear = projectionEndLabels.buildProjectionEndLabelLayout({
    ...base,
    projectedRawValue: 100,
    targetRawValue: 100,
    targetYear: 2035,
  })
  assert.equal(sameValueDifferentYear.combined, false)
  assert.ok(Math.abs(sameValueDifferentYear.projected.y - sameValueDifferentYear.meta.y) >= 22)

  const differentValueSameYear = projectionEndLabels.buildProjectionEndLabelLayout({
    ...base,
    projectedRawValue: 100.000001,
    targetRawValue: 100,
    targetYear: 2036,
  })
  assert.equal(differentValueSameYear.combined, false)
  assert.ok(Math.abs(differentValueSameYear.projected.y - differentValueSameYear.meta.y) >= 22)

  const withoutTarget = projectionEndLabels.buildProjectionEndLabelLayout({
    ...base,
    metaLine: null,
    projectedRawValue: 80,
    targetRawValue: null,
    targetYear: null,
  })
  assert.equal(withoutTarget.combined, false)
  assert.equal(withoutTarget.meta, null)
  assert.ok(withoutTarget.projected.x <= base.chartWidth - base.padding.right)
})
