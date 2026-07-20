import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  PUBLIC_FINANCING_CATALOG,
  PUBLIC_FINANCING_PROGRAMS,
  PUBLIC_FINANCING_RELATIONS,
  PUBLIC_FINANCING_SOURCES,
  buildPublicFinancingItems,
  collectPublicFinancingSources,
} from '../../src/features/diagnostic/diagnosticFinancingPresentation.ts'

const EXPECTED_PROGRAM_IDS = [
  'par_novo_par',
  'novo_pac_educacao',
  'pnate',
  'caminho_escola',
  'peate_rs',
  'escola_tempo_integral',
  'pnae',
  'parfor',
  'proeb_capes',
  'pdde',
]

const EXPECTED_RELATION_IDS = [
  'creche__par_novo_par',
  'creche__novo_pac_educacao',
  'creche__pnate',
  'creche__caminho_escola',
  'pre_escola__par_novo_par',
  'pre_escola__novo_pac_educacao',
  'pre_escola__pnate',
  'pre_escola__caminho_escola',
  'basico_6_17__par_novo_par',
  'basico_6_17__pnate',
  'basico_6_17__caminho_escola',
  'basico_6_17__peate_rs',
  'basico_integral__par_novo_par',
  'basico_integral__novo_pac_educacao',
  'basico_integral__escola_tempo_integral',
  'basico_integral__pnae',
  'escolas_integral__par_novo_par',
  'escolas_integral__novo_pac_educacao',
  'escolas_integral__escola_tempo_integral',
  'escolas_integral__pnae',
  'adequacao_ai__parfor',
  'adequacao_af__parfor',
  'pos_graduacao__proeb_capes',
  'salas_climatizadas__par_novo_par',
  'salas_climatizadas__pdde',
  'salas_acessiveis__pdde',
]

const EXCLUDED_RELATION_IDS = [
  'creche__fundeb_vaar',
  'creche__pnae',
  'creche__peate_rs',
  'pre_escola__fundeb_vaar',
  'pre_escola__pnae',
  'pre_escola__peate_rs',
  'basico_6_17__fundeb_vaar',
  'basico_6_17__pnae',
  'basico_integral__pnate',
  'basico_integral__caminho_escola',
  'escolas_integral__pnate',
  'escolas_integral__caminho_escola',
  'eja_integrada_educacao_profissional_percentual__par_novo_par',
  'idade_regular_quinto__fundeb_vaar',
  'idade_regular_quinto__par_novo_par',
  'idade_regular_quinto__pnae',
  'idade_regular_nono__fundeb_vaar',
  'idade_regular_nono__par_novo_par',
  'idade_regular_nono__pnae',
  'adequacao_ai__par_novo_par',
  'adequacao_ai__bolsa_mais_professores',
  'adequacao_af__par_novo_par',
  'adequacao_af__bolsa_mais_professores',
  'pos_graduacao__par_novo_par',
  'pos_graduacao__bolsa_mais_professores',
  'rendimento_magisterio__par_novo_par',
  'temporarios__par_novo_par',
  'temporarios__bolsa_mais_professores',
  'conselho_escolar__par_novo_par',
  'conselho_escolar__pdde',
  'salas_climatizadas__novo_pac_educacao',
  'salas_acessiveis__par_novo_par',
  'salas_acessiveis__novo_pac_educacao',
  'salas_acessiveis__caminho_escola',
]

const FORBIDDEN_PROGRAM_IDS = new Set([
  'fundeb_vaar',
  'fundeb_vaaf',
  'fundeb_vaat',
  'salario_educacao_qsem',
  'bolsa_mais_professores',
  'programa_nacional_infraestrutura_escolar',
  'siope',
  'siconfi_finbra',
])

const FORBIDDEN_PUBLIC_TERMS = new RegExp([
  'indisponível',
  'pendente',
  'a verificar',
  'não localizado',
  'não integrado',
  'aguardando',
  'cobertura',
  'evidência',
  'investigação',
  'reconciliação',
  'schema',
  'pipeline',
  'contrato',
  'null',
  'gate',
  'classe b',
  'classe c',
  'classe d',
  'elegibilidade',
  'saldo disponível',
  'valor potencial',
  'ganho',
  'perda',
  'score',
  'ranking',
].join('|'), 'i')

function decisionItem(indicatorId) {
  return { indicatorId }
}

function diagnosticFixture({
  action = [],
  coordination = [],
  investigation = [],
  monitoring = [],
  preservation = [],
} = {}) {
  return {
    decisionSummary: {
      municipalActionItems: action.map(decisionItem),
      coordinationItems: coordination.map(decisionItem),
      investigationItems: investigation.map(decisionItem),
      monitoringItems: monitoring.map(decisionItem),
      preservationItems: preservation.map(decisionItem),
    },
  }
}

function collectObjectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, keys)
    return keys
  }
  if (!value || typeof value !== 'object') return keys
  for (const [key, item] of Object.entries(value)) {
    keys.push(key)
    collectObjectKeys(item, keys)
  }
  return keys
}

test('public catalog is the exact 26-relation and 10-program allowlist', () => {
  assert.equal(PUBLIC_FINANCING_CATALOG.catalogVersion, 'diagnostic-public-financing-v1')
  assert.deepEqual(PUBLIC_FINANCING_PROGRAMS.map((program) => program.id), EXPECTED_PROGRAM_IDS)
  assert.deepEqual(PUBLIC_FINANCING_RELATIONS.map((relation) => relation.id), EXPECTED_RELATION_IDS)
  assert.equal(PUBLIC_FINANCING_RELATIONS.length, 26)
  assert.equal(PUBLIC_FINANCING_PROGRAMS.length, 10)
  assert.equal(new Set(PUBLIC_FINANCING_RELATIONS.map((relation) => relation.indicatorId)).size, 10)
  assert.equal(new Set(PUBLIC_FINANCING_RELATIONS.map((relation) => relation.id)).size, 26)
  assert.equal(new Set(PUBLIC_FINANCING_PROGRAMS.map((program) => program.id)).size, 10)
  assert.deepEqual(PUBLIC_FINANCING_RELATIONS.map((relation) => relation.displayOrder), [
    ...Array(26).keys(),
  ].map((index) => index + 1))
})

test('catalog references only real indicators, public programs, and registered sources', async () => {
  const indicatorCatalog = JSON.parse(await readFile(
    new URL('../../src/data/diagnostic/indicatorCatalog.json', import.meta.url),
    'utf8',
  ))
  const indicatorIds = new Set(indicatorCatalog.indicators.map((indicator) => indicator.indicatorId))
  const programIds = new Set(PUBLIC_FINANCING_PROGRAMS.map((program) => program.id))
  const sourceIds = new Set(PUBLIC_FINANCING_SOURCES.map((source) => source.id))

  for (const relation of PUBLIC_FINANCING_RELATIONS) {
    assert.ok(indicatorIds.has(relation.indicatorId), relation.indicatorId)
    assert.ok(programIds.has(relation.programId), relation.programId)
    assert.equal(relation.relationType, 'supported_action')
    assert.match(relation.actionText, /^Pode apoiar/)
    for (const sourceId of relation.sourceIds) assert.ok(sourceIds.has(sourceId), sourceId)
  }
  for (const program of PUBLIC_FINANCING_PROGRAMS) {
    for (const sourceId of program.sourceIds) assert.ok(sourceIds.has(sourceId), sourceId)
  }
})

test('VAAR, general resources, and all 34 excluded relations stay absent', () => {
  const relationIds = new Set(PUBLIC_FINANCING_RELATIONS.map((relation) => relation.id))
  assert.equal(EXCLUDED_RELATION_IDS.length, 34)
  for (const relationId of EXCLUDED_RELATION_IDS) assert.equal(relationIds.has(relationId), false)
  for (const relation of PUBLIC_FINANCING_RELATIONS) {
    assert.equal(FORBIDDEN_PROGRAM_IDS.has(relation.programId), false)
    assert.doesNotMatch(relation.id, /fundeb|salario_educacao|vaar/)
  }
})

test('selector uses municipal action and coordination, ignoring other collections', () => {
  const items = buildPublicFinancingItems(diagnosticFixture({
    action: ['creche', 'salas_climatizadas'],
    coordination: ['pre_escola'],
    investigation: ['salas_acessiveis'],
    monitoring: ['pos_graduacao'],
    preservation: ['adequacao_ai', 'adequacao_af'],
  }))
  const programIds = items.map((item) => item.programId)
  const relatedIndicators = new Set(items.flatMap((item) => item.relatedIndicators))

  assert.ok(programIds.includes('par_novo_par'))
  assert.ok(programIds.includes('novo_pac_educacao'))
  assert.ok(programIds.includes('pnate'))
  assert.ok(programIds.includes('caminho_escola'))
  assert.ok(programIds.includes('pdde'))
  assert.equal(programIds.includes('proeb_capes'), false)
  assert.equal(programIds.includes('parfor'), false)
  assert.equal(relatedIndicators.has('salas_acessiveis'), false)
  assert.equal(relatedIndicators.has('pos_graduacao'), false)
  assert.equal(relatedIndicators.has('adequacao_ai'), false)
  assert.equal(relatedIndicators.has('adequacao_af'), false)
})

test('same program is consolidated while equivalent actions and phrases are deduplicated', () => {
  const items = buildPublicFinancingItems(diagnosticFixture({
    action: ['creche', 'pre_escola'],
    coordination: ['basico_6_17'],
  }))
  const pnateItems = items.filter((item) => item.programId === 'pnate')
  const caminhoItems = items.filter((item) => item.programId === 'caminho_escola')

  assert.equal(pnateItems.length, 1)
  assert.deepEqual(pnateItems[0].relatedIndicators, ['creche', 'pre_escola', 'basico_6_17'])
  assert.equal(pnateItems[0].actions.length, 1)
  assert.deepEqual(pnateItems[0].actions[0].indicatorIds, ['creche', 'pre_escola', 'basico_6_17'])
  assert.equal(pnateItems[0].scopes.length, 1)
  assert.equal(caminhoItems.length, 1)
  assert.equal(caminhoItems[0].actions.length, 1)
  assert.equal(caminhoItems[0].scopes.length, 1)
  assert.equal(new Set(items.map((item) => item.programId)).size, items.length)
})

test('different actions from the same program remain linked to their indicators', () => {
  const items = buildPublicFinancingItems(diagnosticFixture({
    action: ['salas_climatizadas'],
    coordination: ['salas_acessiveis'],
  }))
  const pdde = items.find((item) => item.programId === 'pdde')

  assert.ok(pdde)
  assert.deepEqual(pdde.relatedIndicators, ['salas_climatizadas', 'salas_acessiveis'])
  assert.equal(pdde.actions.length, 2)
  assert.deepEqual(pdde.actions.map((action) => action.indicatorIds), [
    ['salas_climatizadas'],
    ['salas_acessiveis'],
  ])
  assert.equal(pdde.scopes.length, 1)
})

test('empty, null, and unrelated selections return an empty list', () => {
  assert.deepEqual(buildPublicFinancingItems(null), [])
  assert.deepEqual(buildPublicFinancingItems(diagnosticFixture()), [])
  assert.deepEqual(buildPublicFinancingItems(diagnosticFixture({
    investigation: ['creche'],
    monitoring: ['pos_graduacao'],
    preservation: ['pre_escola'],
  })), [])
  assert.deepEqual(buildPublicFinancingItems(diagnosticFixture({
    action: ['temporarios'],
    coordination: ['conselho_escolar'],
  })), [])
})

test('source collector deduplicates and omits sources from programs not displayed', () => {
  const items = buildPublicFinancingItems(diagnosticFixture({ action: ['pos_graduacao'] }))
  const sources = collectPublicFinancingSources(items)

  assert.deepEqual(items.map((item) => item.programId), ['proeb_capes'])
  assert.deepEqual(sources.map((source) => source.id), ['capes_proeb'])
  assert.equal(new Set(sources.map((source) => source.id)).size, sources.length)
  assert.equal(sources.some((source) => source.id === 'fnde_par'), false)
  assert.deepEqual(collectPublicFinancingSources([]), [])
})

test('public texts and object fields contain no internal, financial, or eligibility language', () => {
  const textValues = [
    ...PUBLIC_FINANCING_PROGRAMS.flatMap((program) => [
      program.publicName,
      program.shortDescription ?? '',
    ]),
    ...PUBLIC_FINANCING_RELATIONS.flatMap((relation) => [
      relation.actionText,
      relation.scopeText ?? '',
    ]),
    ...PUBLIC_FINANCING_SOURCES.flatMap((source) => [
      source.organization,
      source.publicTitle,
      source.yearLabel,
    ]),
  ]
  for (const value of textValues) assert.doesNotMatch(value, FORBIDDEN_PUBLIC_TERMS)

  const allIndicators = [...new Set(PUBLIC_FINANCING_RELATIONS.map((relation) => relation.indicatorId))]
  const output = buildPublicFinancingItems(diagnosticFixture({ action: allIndicators }))
  const forbiddenFieldNames = new Set([
    'amount',
    'availability',
    'balance',
    'coverage',
    'eligibility',
    'financialValue',
    'ranking',
    'score',
    'status',
    'value',
  ])
  for (const key of collectObjectKeys([PUBLIC_FINANCING_CATALOG, output])) {
    assert.equal(forbiddenFieldNames.has(key), false, key)
  }
})
