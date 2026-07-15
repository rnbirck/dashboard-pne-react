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
