import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

import {
  buildPublicDiagnosticCopy,
  buildPublicSummaryText,
  getPublicOfficialSources,
  getPublicRelationshipNote,
  getPublicResultStatus,
  getPublicSupportingReadings,
  selectMunicipalDiagnosticContract,
} from '../../src/features/diagnostic/diagnosticPresentation.js'

const PUBLIC_VERSION = 'pne2026-public-diagnostic-v2'
const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  root: projectRoot,
  server: { middlewareMode: true },
})
const { DiagnosticPanel } = await vite.ssrLoadModule('/src/components/DiagnosticPanel.jsx')

test.after(async () => {
  await vite.close()
})

async function readContract(slug) {
  return JSON.parse(await readFile(
    new URL(`../../public/data/municipios/${slug}/diagnostico.json`, import.meta.url),
    'utf8',
  ))
}

function flatten(diagnostic) {
  return diagnostic.goals.flatMap((goal) => goal.results)
}

function renderDiagnostic(contract, municipio = 'Município de teste') {
  return renderToStaticMarkup(createElement(DiagnosticPanel, {
    contractStatus: 'ready',
    data: contract,
    municipio,
  }))
}

function visibleText(markup) {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

test('selection accepts only the supported technical contract with public v2', () => {
  assert.equal(selectMunicipalDiagnosticContract(null).status, 'missing')
  assert.equal(selectMunicipalDiagnosticContract({ schemaVersion: 'future' }).status, 'incompatible_version')
  assert.equal(selectMunicipalDiagnosticContract({
    schemaVersion: 'municipal-diagnostic-v2',
    pne2026PublicDiagnostic: { version: 'pne2026-public-diagnostic-v1' },
  }).status, 'incompatible_version')
  assert.equal(selectMunicipalDiagnosticContract({
    schemaVersion: 'municipal-diagnostic-v2',
    pne2026PublicDiagnosticV2: { version: PUBLIC_VERSION },
  }).status, 'ready')
})

test('summary uses only advance, maintain, and unclassified public counters', () => {
  const summary = {
    advanceCount: 22,
    maintainCount: 2,
    unclassifiedCount: 3,
    stateComparisonCount: 17,
    statewidePositionCount: 17,
  }
  assert.equal(
    buildPublicSummaryText(summary),
    'O diagnóstico reúne 22 pontos para avançar, 2 resultados a manter e 3 resultados para acompanhamento.',
  )
  assert.doesNotMatch(buildPublicSummaryText(summary), /Rio Grande do Sul|comparação|posição/i)
})

test('initial page renders the public diagnostic grouped by theme', async () => {
  const contract = await readContract('restinga-seca')
  const diagnostic = contract.pne2026PublicDiagnosticV2
  const essentials = flatten(diagnostic)
    .filter((result) => result.tier === 'essential')
    .toSorted((left, right) => left.priorityOrder - right.priorityOrder)
  const markup = renderDiagnostic(contract, 'Restinga Seca')
  const text = visibleText(markup)

  assert.match(text, /Diagnóstico educacional de Restinga Seca/)
  assert.match(text, /Resumo do diagnóstico/)
  assert.match(text, /Filtros/)
  assert.match(text, /Resultados por tema/)
  assert.match(text, /Plano Nacional de Educação/)
  assert.deepEqual(
    essentials.map((result) => result.priorityOrder),
    essentials.map((result) => result.priorityOrder).toSorted((left, right) => left - right),
  )
  assert.equal(new Set(essentials.map((result) => result.priorityOrder)).size, essentials.length)
  assert.ok(essentials.every((result) => result.priorityOrder >= 1 && result.priorityOrder <= 9))
  assert.ok(essentials.every((result) => text.includes(result.publicName)))
  assert.doesNotMatch(text, /tier|priorityOrder|essencial \d de 9/i)
})

test('unclassified results and relationships use the approved neutral language', async () => {
  const contract = await readContract('restinga-seca')
  const results = flatten(contract.pne2026PublicDiagnosticV2)
  const proxy = results.find((result) => result.relationshipType === 'contextual_proxy')
  const partial = results.find((result) => result.relationshipType === 'partial_component')
  const followup = results.find((result) => (
    result.classification == null && result.relationshipType !== 'contextual_proxy'
  ))

  assert.deepEqual(getPublicResultStatus(proxy), { key: 'context', label: 'Resultado de contexto' })
  assert.equal(
    getPublicRelationshipNote(proxy),
    'Este resultado ajuda a contextualizar a meta, mas não mede sozinho o seu cumprimento.',
  )
  assert.equal(
    getPublicRelationshipNote(partial),
    'Este é um dos resultados acompanhados nesta meta.',
  )
  assert.deepEqual(
    getPublicResultStatus(followup),
    { key: 'followup', label: 'Resultado para acompanhamento' },
  )
})

test('public comparisons and trajectories render without technical terms', async () => {
  const contract = await readContract('restinga-seca')
  const results = flatten(contract.pne2026PublicDiagnosticV2)
  assert.ok(results.some((result) => result.stateComparison?.reading))
  assert.ok(results.some((result) => getPublicSupportingReadings(result).length > 0))
  const markup = renderDiagnostic(contract, 'Restinga Seca')
  const text = visibleText(markup)
  assert.match(text, /Comparação com a média dos municípios do RS neste indicador/)
  assert.match(text, /Posição no RS/)
  assert.match(text, /Evolução recente/)
  assert.match(text, /Acima ou próximos do RS/)
  assert.match(text, /Abaixo do RS/)
  assert.match(
    text,
    /Veja os resultados do município em relação às metas do PNE e ao contexto dos municípios do Rio Grande do Sul\./,
  )
  assert.doesNotMatch(text, /better|equivalent|similar|worse|percentil|quartil|coorte|cluster|modelo|quality/i)
})

test('copy is complete, v2-only, independent of filters, and does not duplicate essentials', async () => {
  const contract = await readContract('restinga-seca')
  const diagnostic = contract.pne2026PublicDiagnosticV2
  const text = buildPublicDiagnosticCopy(diagnostic, 'Restinga Seca')
  const results = flatten(diagnostic)

  assert.match(text, /Resumo do diagnóstico/)
  assert.match(text, /Pontos para avançar: 22\./)
  assert.match(text, /Resultados a manter: 2\./)
  assert.match(text, /Resultados para acompanhamento: 3\./)
  assert.match(text, /Acima ou próximos do RS: 3\./)
  assert.match(text, /Abaixo do RS: 14\./)
  assert.match(text, /Comparação com o RS/)
  assert.match(text, /Posição entre os municípios do RS/)
  assert.match(text, /Municípios com oferta educacional de tamanho semelhante/)
  assert.match(text, /Evolução recente/)
  assert.match(text, /Resultados essenciais/)
  assert.match(text, /Demais resultados/)
  assert.match(text, /Fontes das informações/)
  for (const result of results) {
    assert.equal(text.split(result.publicName).length - 1, 1, result.indicatorId)
  }
  assert.doesNotMatch(text, /priorityOrder|\btier\b|pne2026-public|financiamento|null|undefined|NaN/i)
})

test('only complete official sources from v2 are rendered with distinct names', async () => {
  const contract = await readContract('restinga-seca')
  const diagnostic = contract.pne2026PublicDiagnosticV2
  const officialSources = getPublicOfficialSources(diagnostic.sources)
  const markup = renderDiagnostic(contract, 'Restinga Seca')

  assert.equal(officialSources.length, 3)
  assert.equal(
    (markup.match(/aria-label="Acessar fonte oficial: /g) ?? []).length,
    officialSources.length,
  )
  assert.doesNotMatch(visibleText(markup), /proveniência pendente|Base municipal de população por idade/i)
})

test('missing or incompatible public v2 renders only the operational error', () => {
  const text = visibleText(renderToStaticMarkup(createElement(DiagnosticPanel, {
    contractStatus: 'incompatible_version',
    data: { schemaVersion: 'municipal-diagnostic-v2' },
    municipio: 'Teste',
  })))
  assert.equal(text, 'Não foi possível abrir o diagnóstico agora. Tente novamente.')
})

test('route consumes v2 exclusively without legacy or frontend business-rule sources', async () => {
  const [panelSource, presentationSource, pageSource] = await Promise.all([
    readFile(new URL('../../src/components/DiagnosticPanel.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../src/features/diagnostic/diagnosticPresentation.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/pages/Diagnostico.jsx', import.meta.url), 'utf8'),
  ])
  const combined = `${panelSource}\n${presentationSource}\n${pageSource}`

  assert.match(panelSource, /data\?\.pne2026PublicDiagnosticV2/)
  assert.doesNotMatch(combined, /pne2026PublicDiagnostic(?!V2)/)
  assert.doesNotMatch(combined, /analysis\.indicators|decisionSummary|attentionItems|preservedItems/)
  assert.doesNotMatch(combined, /DiagnosticFinancingSection|buildPublicFinancingItems|DF2/)
  assert.doesNotMatch(presentationSource, /favorableDifference\s*[+-]|performancePercentile/)
})

test('read-only audit confirms all 497 v2 contracts and representative special values', async (t) => {
  const index = JSON.parse(await readFile(
    new URL('../../public/data/municipios_index.json', import.meta.url),
    'utf8',
  ))
  const metrics = {
    contracts: 0,
    results: 0,
    advance: 0,
    maintain: 0,
    unclassified: 0,
    stateComparisons: 0,
    statewidePositions: 0,
    similarMunicipalities: 0,
    trajectories: 0,
    estimatedAchievementYears: 0,
    publicSupportingReadings: 0,
    negative: 0,
    above100: 0,
    proxies: 0,
    duplicate: 0,
  }
  const rows = []

  for (const municipality of index.municipios) {
    const contract = await readContract(municipality.slug)
    const diagnostic = contract.pne2026PublicDiagnosticV2
    assert.equal(diagnostic?.version, PUBLIC_VERSION, municipality.slug)
    const results = flatten(diagnostic)
    const ids = results.map((result) => result.indicatorId)
    const essentials = results.filter((result) => result.tier === 'essential')
      .toSorted((left, right) => left.priorityOrder - right.priorityOrder)
    assert.deepEqual(
      essentials.map((result) => result.priorityOrder),
      essentials.map((result) => result.priorityOrder).toSorted((left, right) => left - right),
      municipality.slug,
    )
    assert.equal(new Set(essentials.map((result) => result.priorityOrder)).size, essentials.length)
    assert.ok(essentials.every((result) => result.priorityOrder >= 1 && result.priorityOrder <= 9))
    assert.equal(diagnostic.summary.advanceCount, results.filter((result) => result.classification === 'advance').length)
    assert.equal(diagnostic.summary.maintainCount, results.filter((result) => result.classification === 'maintain').length)
    assert.equal(diagnostic.summary.unclassifiedCount, results.filter((result) => result.classification == null).length)
    assert.equal(
      diagnostic.summary.stateAboveOrNearCount,
      results.filter((result) => ['above', 'near'].includes(result.stateComparison?.state)).length,
    )
    assert.equal(
      diagnostic.summary.stateBelowCount,
      results.filter((result) => result.stateComparison?.state === 'below').length,
    )

    metrics.contracts += 1
    metrics.results += results.length
    metrics.advance += diagnostic.summary.advanceCount
    metrics.maintain += diagnostic.summary.maintainCount
    metrics.unclassified += diagnostic.summary.unclassifiedCount
    metrics.stateComparisons += results.filter((result) => result.stateComparison).length
    metrics.statewidePositions += results.filter((result) => result.statewidePosition).length
    metrics.similarMunicipalities += results.filter((result) => result.similarMunicipalities).length
    metrics.trajectories += results.filter((result) => result.trajectory).length
    metrics.estimatedAchievementYears += results.filter(
      (result) => Number.isFinite(result.trajectory?.estimatedAchievementYear),
    ).length
    metrics.publicSupportingReadings += results.reduce(
      (total, result) => total + getPublicSupportingReadings(result).length,
      0,
    )
    metrics.negative += results.filter((result) => result.current.value < 0).length
    metrics.above100 += results.filter((result) => result.current.value > 100).length
    metrics.proxies += results.filter((result) => (
      result.relationshipType === 'contextual_proxy' && result.classification == null
    )).length
    metrics.duplicate += ids.length - new Set(ids).size
    rows.push({
      slug: municipality.slug,
      resultCount: results.length,
      essentialCount: essentials.length,
      unclassifiedCount: diagnostic.summary.unclassifiedCount,
      lacksRendimento: !ids.includes('rendimento_magisterio'),
    })
  }

  assert.deepEqual(metrics, {
    contracts: 497,
    results: 15896,
    advance: 11972,
    maintain: 2447,
    unclassified: 1477,
    stateComparisons: 8473,
    statewidePositions: 7951,
    similarMunicipalities: 7616,
    trajectories: 9505,
    estimatedAchievementYears: 1731,
    publicSupportingReadings: 25072,
    negative: 127,
    above100: 494,
    proxies: 994,
    duplicate: 0,
  })
  assert.equal(Math.min(...rows.map((row) => row.resultCount)), 26)
  assert.equal(Math.max(...rows.map((row) => row.resultCount)), 34)
  assert.ok(rows.some((row) => row.lacksRendimento))
  assert.ok(rows.every((row) => row.essentialCount <= 9))
  t.diagnostic(`inspection-cases=${JSON.stringify({
    minimum: rows.find((row) => row.resultCount === 26)?.slug,
    maximum: rows.find((row) => row.resultCount === 34)?.slug,
    mostEssentials: rows.toSorted((a, b) => b.essentialCount - a.essentialCount)[0]?.slug,
    mostUnclassified: rows.toSorted((a, b) => b.unclassifiedCount - a.unclassifiedCount)[0]?.slug,
    withoutRendimento: rows.find((row) => row.lacksRendimento)?.slug,
  })}`)
})

test('diagnostic remains lazy and outside the initial payload', async () => {
  const [initialPayload, pageSource, routerSource] = await Promise.all([
    readFile(new URL('../../public/data/municipios/agudo/index.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../src/pages/Diagnostico.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../src/app/AppPageRouter.tsx', import.meta.url), 'utf8'),
  ])
  assert.equal('diagnostico_v2' in initialPayload.pne_2026_2036, false)
  assert.match(pageSource, /useMunicipioDiagnostic\(slug\)/)
  assert.match(routerSource, /const LazyDiagnostico = lazy/)
})
