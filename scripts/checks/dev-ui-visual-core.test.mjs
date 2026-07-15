import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  parseVisualArguments,
  persistBaseline,
  selectVisualCases,
  validateCatalogManifest,
} from './dev-ui-visual-core.mjs'

const require = createRequire(import.meta.url)
const { PNG } = require('../../node_modules/playwright-core/lib/utilsBundle.js')
const { comparePng, writeComparisonArtifacts } = require('./visual-comparison.cjs')

function createPng(width, height, color) {
  const png = new PNG({ height, width })
  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = color[0]
    png.data[index + 1] = color[1]
    png.data[index + 2] = color[2]
    png.data[index + 3] = color[3]
  }
  return PNG.sync.write(png)
}

function manifestFixture() {
  return {
    categories: [
      { id: 'education', label: 'Educação' },
      { id: 'finance', label: 'Financiamento' },
    ],
    scenarios: [
      {
        categoryId: 'education',
        id: 'education-card',
        title: 'Card educacional',
        visual: { enabled: true, viewports: ['desktop', 'mobile'] },
      },
      {
        categoryId: 'education',
        id: 'education-detail',
        title: 'Detalhe educacional',
        visual: { enabled: true, viewports: ['notebook'] },
      },
      {
        categoryId: 'finance',
        id: 'finance-interaction',
        title: 'Interação financeira',
        visual: { enabled: false, viewports: [] },
      },
    ],
    viewports: [
      { height: 900, id: 'desktop', width: 1366 },
      { height: 900, id: 'notebook', width: 1024 },
      { height: 844, id: 'mobile', width: 390 },
    ],
  }
}

test('rejeita IDs duplicados de cenário', () => {
  const manifest = manifestFixture()
  manifest.scenarios.push({ ...manifest.scenarios[0] })
  assert.throws(() => validateCatalogManifest(manifest), /IDs de cenário duplicados: education-card/)
})

test('interpreta e combina os filtros suportados', () => {
  assert.deepEqual(
    parseVisualArguments(['--scenario', 'education-card', '--category=education', '--viewport', 'mobile']),
    { category: 'education', scenario: 'education-card', update: false, viewport: 'mobile' },
  )
})

test('filtra por cenário', () => {
  const cases = selectVisualCases(manifestFixture(), { category: null, scenario: 'education-card', viewport: null })
  assert.deepEqual(cases.map(({ id, viewport }) => `${id}.${viewport}`), [
    'education-card.desktop',
    'education-card.mobile',
  ])
})

test('filtra por categoria', () => {
  const cases = selectVisualCases(manifestFixture(), { category: 'education', scenario: null, viewport: null })
  assert.equal(cases.length, 3)
  assert.ok(cases.every((item) => item.categoryId === 'education'))
})

test('filtra por viewport', () => {
  const cases = selectVisualCases(manifestFixture(), { category: null, scenario: null, viewport: 'mobile' })
  assert.deepEqual(cases.map(({ id }) => id), ['education-card'])
})

test('cenário inexistente falha e lista opções válidas', () => {
  assert.throws(
    () => selectVisualCases(manifestFixture(), { category: null, scenario: 'missing', viewport: null }),
    /Cenário inexistente: missing.*education-card.*education-detail/,
  )
})

test('baseline ausente falha com comando de criação direcionado', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-ui-visual-missing-'))
  const baselinePath = path.join(directory, 'missing.png')
  assert.throws(
    () => persistBaseline({
      actualBuffer: Buffer.from('atual'),
      baselinePath,
      update: false,
      updateCommand: 'npm run test:dev-ui:visual:update -- --scenario education-card --viewport desktop',
    }),
    /Baseline ausente.*education-card --viewport desktop/,
  )
  assert.equal(fs.existsSync(baselinePath), false)
  fs.rmSync(directory, { force: true, recursive: true })
})

test('comando normal não sobrescreve baseline', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-ui-visual-read-'))
  const baselinePath = path.join(directory, 'existing.png')
  fs.writeFileSync(baselinePath, 'esperado')
  const expected = persistBaseline({
    actualBuffer: Buffer.from('atual'),
    baselinePath,
    update: false,
    updateCommand: 'update selected',
  })
  assert.equal(expected.toString(), 'esperado')
  assert.equal(fs.readFileSync(baselinePath, 'utf8'), 'esperado')
  fs.rmSync(directory, { force: true, recursive: true })
})

test('comando de atualização altera somente o baseline selecionado', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-ui-visual-update-'))
  const selected = path.join(directory, 'selected.png')
  const unrelated = path.join(directory, 'unrelated.png')
  fs.writeFileSync(selected, 'anterior')
  fs.writeFileSync(unrelated, 'preservado')
  persistBaseline({
    actualBuffer: Buffer.from('novo'),
    baselinePath: selected,
    update: true,
    updateCommand: 'update selected',
  })
  assert.equal(fs.readFileSync(selected, 'utf8'), 'novo')
  assert.equal(fs.readFileSync(unrelated, 'utf8'), 'preservado')
  fs.rmSync(directory, { force: true, recursive: true })
})

test('comparação trata dimensões divergentes como falha e grava os três diagnósticos', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-ui-visual-diff-'))
  const comparison = comparePng(
    createPng(2, 1, [255, 255, 255, 255]),
    createPng(1, 1, [0, 0, 0, 255]),
  )
  assert.equal(comparison.sameDimensions, false)
  assert.equal(comparison.differentPixels, 2)
  const artifacts = writeComparisonArtifacts(directory, 'dimension-test.png', comparison)
  assert.ok(Object.values(artifacts).every((artifactPath) => fs.existsSync(artifactPath)))
  fs.rmSync(directory, { force: true, recursive: true })
})
