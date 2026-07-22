import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const registryPath = new URL('../../src/data/financialIndicatorRegistry.ts', import.meta.url)
const source = await readFile(registryPath, 'utf8')
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: registryPath.pathname,
})
const registryModule = await import(`data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`)

const {
  FINANCIAL_INDICATOR_LEGACY_MAP,
  FINANCIAL_INDICATOR_REGISTRY,
} = registryModule

const requiredTextFields = [
  'id',
  'publicName',
  'shortName',
  'question',
  'importance',
  'definition',
  'unit',
  'domain',
  'stage',
  'nature',
  'source',
  'periodType',
  'nullRule',
  'zeroMeaning',
  'formula',
  'roundingRule',
  'yearComparability',
  'methodologyNote',
  'recommendedContext',
]

test('o registro contém 90 IDs canônicos estáveis e únicos', () => {
  assert.equal(FINANCIAL_INDICATOR_REGISTRY.length, 90)
  const ids = FINANCIAL_INDICATOR_REGISTRY.map((indicator) => indicator.id)
  assert.equal(new Set(ids).size, ids.length)
  ids.forEach((id) => {
    assert.match(id, /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)
    assert.doesNotMatch(id, /(?:19|20)\d{2}/)
  })
})

test('todo indicador público possui o contrato semântico mínimo', () => {
  FINANCIAL_INDICATOR_REGISTRY.forEach((indicator) => {
    requiredTextFields.forEach((field) => {
      assert.equal(typeof indicator[field], 'string', `${indicator.id}.${field}`)
      assert.ok(indicator[field].trim().length > 0, `${indicator.id}.${field}`)
    })
    assert.ok(indicator.originFields.length > 0, `${indicator.id}.originFields`)
    assert.ok(indicator.roles.length > 0, `${indicator.id}.roles`)
    assert.ok(indicator.aliases.length > 0, `${indicator.id}.aliases`)
    assert.equal(indicator.roles.includes('internal'), false, `${indicator.id}.roles`)
    assert.equal(typeof indicator.requiresReconciliation, 'boolean', `${indicator.id}.requiresReconciliation`)
    assert.ok(indicator.doubleCountingRisk.note.trim().length > 0, `${indicator.id}.doubleCountingRisk`)
  })
})

test('aliases não apontam para IDs canônicos diferentes', () => {
  const ownerByAlias = new Map()
  FINANCIAL_INDICATOR_REGISTRY.forEach((indicator) => {
    indicator.aliases.forEach((alias) => {
      const normalized = alias.trim().toLocaleLowerCase('pt-BR')
      const previousOwner = ownerByAlias.get(normalized)
      assert.ok(!previousOwner || previousOwner === indicator.id, `${alias}: ${previousOwner} x ${indicator.id}`)
      ownerByAlias.set(normalized, indicator.id)
    })
  })
})

test('todo campo legado mapeado aponta para um ID canônico existente', () => {
  const ids = new Set(FINANCIAL_INDICATOR_REGISTRY.map((indicator) => indicator.id))
  FINANCIAL_INDICATOR_LEGACY_MAP.forEach((mapping) => {
    assert.ok(ids.has(mapping.canonicalId), `${mapping.catalog}.${mapping.field}`)
  })

  const counts = Object.fromEntries(['panorama', 'siope', 'fundeb', 'vaar', 'pnate'].map((catalog) => [
    catalog,
    FINANCIAL_INDICATOR_LEGACY_MAP.filter((mapping) => mapping.catalog === catalog).length,
  ]))
  assert.deepEqual(counts, { panorama: 28, siope: 14, fundeb: 13, vaar: 31, pnate: 10 })
})

test('o registro contém somente metadados, sem séries ou valores municipais', () => {
  const forbiddenKeys = new Set([
    'ibgeCode',
    'municipality',
    'municipio',
    'series',
    'value',
    'values',
  ])

  FINANCIAL_INDICATOR_REGISTRY.forEach((indicator) => {
    Object.keys(indicator).forEach((key) => {
      assert.equal(forbiddenKeys.has(key), false, `${indicator.id}.${key}`)
    })
  })
})
