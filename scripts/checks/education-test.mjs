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

const indicators = [
  { key: 'b', label: 'Zeta', description: 'Atendimento escolar', themeLabel: 'Matrículas' },
  { key: 'a', label: 'Álfa', description: 'Trajetória', categoryLabel: 'Fluxo' },
]

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
    { contextScope: 'Demanda e projeções', isDemandSection: true, isMethodologySection: false, isOverviewSection: false },
  )
  assert.equal(
    viewModels.buildEducationPageViewModel({ sectionItemCount: 1, selectedSectionKey: 'overview', sectionKeys: sections }).contextScope,
    '1 indicador',
  )
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
